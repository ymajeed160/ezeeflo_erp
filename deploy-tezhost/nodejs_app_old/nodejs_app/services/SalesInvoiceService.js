'use strict';
const { sequelize } = require('../models');
const SalesInvoiceRepository = require('../repositories/SalesInvoiceRepository');
const SalesInvoiceDTO = require('../dto/SalesInvoiceDTO');
const InventoryTransactionService = require('./InventoryTransactionService');
const AuditService = require('./AuditService');
const { Op } = require('sequelize');

class SalesInvoiceService {
  /**
   * List invoices with pagination, filtering, sorting, searching
   */
  static async list(tenantId, query = {}) {
    const { data, count, page, limit, totalPages } = await SalesInvoiceRepository.findAll(tenantId, query);
    return {
      data: data.map(SalesInvoiceDTO.toList),
      count,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * List posted invoices for customer payment allocation
   * Returns only invoices with outstanding balance > 0
   */
  static async listForAllocation(tenantId, customerId, paymentId = null) {
    if (!customerId) {
      return { data: [] };
    }
    const invoices = await SalesInvoiceRepository.findAllForAllocation(tenantId, customerId, paymentId);
    return {
      data: invoices.map(SalesInvoiceDTO.toAllocationList),
    };
  }

  /**
   * Get invoice by ID
   */
  static async getById(tenantId, id) {
    const invoice = await SalesInvoiceRepository.findById(tenantId, id);
    if (!invoice) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }
    return SalesInvoiceDTO.toDetail(invoice);
  }

  /**
   * Create invoice with details, generate invoice number
   */
  static async create(tenantId, body, userId) {
    const t = await sequelize.transaction();
    try {
      // Generate invoice number if not provided
      if (!body.invoiceNumber) {
        body.invoiceNumber = await SalesInvoiceService.generateInvoiceNumber(tenantId);
      }

      const data = SalesInvoiceDTO.toCreate(body, tenantId, userId);
      const invoice = await SalesInvoiceRepository.create(data, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'CREATE',
        entity: 'SalesInvoice',
        entityId: invoice.id,
        newValues: { invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal },
      }, t);

      await t.commit();
      return SalesInvoiceDTO.toDetail(invoice);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Update invoice (only draft invoices can be updated)
   */
  static async update(tenantId, id, body, userId) {
    const existing = await SalesInvoiceRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft invoices can be updated');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      const data = SalesInvoiceDTO.toUpdate(body, userId);
      const updated = await SalesInvoiceRepository.update(tenantId, id, data, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'UPDATE',
        entity: 'SalesInvoice',
        entityId: id,
        oldValues: { grandTotal: existing.grandTotal },
        newValues: { grandTotal: updated.grandTotal },
      }, t);

      await t.commit();
      return SalesInvoiceDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Delete invoice (only draft)
   */
  static async delete(tenantId, id) {
    const existing = await SalesInvoiceRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft invoices can be deleted');
      error.status = 400;
      throw error;
    }
    const t = await sequelize.transaction();
    try {
      await SalesInvoiceRepository.delete(tenantId, id, t);
      await t.commit();
      return { message: 'Sales Invoice deleted successfully' };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Post invoice: Create journal entry + inventory impact
   * This is the accounting + inventory integration point
   */
  static async post(tenantId, id, userId, body = {}) {
    const existing = await SalesInvoiceRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft invoices can be posted');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      // Apply account overrides from the post dialog if provided
      if (body.customerAccountId || body.revenueAccountId || body.taxAccountId) {
        const updateData = {};
        if (body.customerAccountId) updateData.customerAccountId = body.customerAccountId;
        if (body.revenueAccountId) updateData.revenueAccountId = body.revenueAccountId;
        if (body.taxAccountId) updateData.taxAccountId = body.taxAccountId;
        await SalesInvoiceRepository.update(tenantId, id, updateData, t);
        // Apply the updated values to the existing object (no re-fetch needed)
        if (body.customerAccountId) existing.customerAccountId = body.customerAccountId;
        if (body.revenueAccountId) existing.revenueAccountId = body.revenueAccountId;
        if (body.taxAccountId) existing.taxAccountId = body.taxAccountId;
      }

      // Use existing (with potential account overrides) for posting
      const invoice = existing;

      // Validate accounts before posting
      await SalesInvoiceService.validatePostingAccounts(tenantId, invoice);

      // 1. Create Journal Entry
      const JournalEntryService = require('./JournalEntryService');
      const journalLines = await SalesInvoiceService.buildJournalLines(tenantId, invoice);

      const journalEntry = await JournalEntryService.createEntry({
        tenantId,
        entryDate: invoice.invoiceDate,
        reference: `INV-${invoice.invoiceNumber}`,
        description: `Sales Invoice #${invoice.invoiceNumber} - Customer: ${invoice.customer ? invoice.customer.name : ''}`,
        lines: journalLines,
      }, tenantId, userId, t);

      // Link journal entry to invoice
      await SalesInvoiceRepository.setJournalEntry(tenantId, id, journalEntry.id, t);

      // 2. Inventory Impact (if configured)
      if (invoice.isInventoryImpact) {
        await SalesInvoiceService.processInventoryImpact(tenantId, invoice, userId, t);
      }

      // 3. Update status to posted
      await SalesInvoiceRepository.updateStatus(tenantId, id, 'posted', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'POST',
        entity: 'SalesInvoice',
        entityId: id,
        newValues: { status: 'posted', journalEntryId: journalEntry.id },
      }, t);

      await t.commit();

      const updated = await SalesInvoiceRepository.findById(tenantId, id);
      return SalesInvoiceDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Validate that the invoice has proper accounts configured before posting
   */
  static async validatePostingAccounts(tenantId, invoice) {
    const { Account } = require('../models');

    // Customer Account (AR) is required
    if (!invoice.customerAccountId) {
      throw new Error('Customer Account (Accounts Receivable) is not configured on this invoice');
    }
    const arAccount = await Account.findOne({
      where: { id: invoice.customerAccountId, tenantId, isActive: true },
    });
    if (!arAccount) {
      throw new Error('Customer Account is invalid, inactive, or belongs to a different tenant');
    }

    // Revenue Account is required
    if (!invoice.revenueAccountId) {
      throw new Error('Sales Revenue Account is not configured on this invoice');
    }
    const revAccount = await Account.findOne({
      where: { id: invoice.revenueAccountId, tenantId, isActive: true },
    });
    if (!revAccount) {
      throw new Error('Sales Revenue Account is invalid, inactive, or belongs to a different tenant');
    }

    // Tax Account is required when tax exists
    if (parseFloat(invoice.taxTotal) > 0) {
      if (!invoice.taxAccountId) {
        throw new Error('Tax Account (VAT Payable) is required because invoice has tax amount');
      }
      const taxAccount = await Account.findOne({
        where: { id: invoice.taxAccountId, tenantId, isActive: true },
      });
      if (!taxAccount) {
        throw new Error('Tax Account is invalid, inactive, or belongs to a different tenant');
      }
    }
  }

  /**
   * Build journal entry lines for sales invoice
   * 
   * Uses accounts selected on the invoice (customerAccountId, revenueAccountId, taxAccountId).
   * 
   * DR Accounts Receivable (Customer Account) - Grand Total
   * CR Sales Revenue (Revenue Account) - Sub Total (net of discounts)
   * CR VAT Payable (Tax Account) - Tax Total
   * 
   * If Inventory Impact is enabled, additional lines are generated:
   * DR Cost of Goods Sold (Item expenseAccountId)
   * CR Inventory Asset (Item inventoryAccountId)
   */
  static async buildJournalLines(tenantId, invoice) {
    const lines = [];

    // 1. DR Accounts Receivable - grandTotal
    lines.push({
      accountId: invoice.customerAccountId,
      debit: parseFloat(invoice.grandTotal),
      credit: 0,
      description: `Sales Invoice #${invoice.invoiceNumber}`,
    });

    // 2. CR Sales Revenue - subtotal (net of discounts)
    const subTotal = parseFloat(invoice.subTotal || 0);
    const discountTotal = parseFloat(invoice.discountTotal || 0);
    const netRevenue = subTotal - discountTotal;

    lines.push({
      accountId: invoice.revenueAccountId,
      debit: 0,
      credit: parseFloat(netRevenue.toFixed(2)),
      description: `Sales Invoice #${invoice.invoiceNumber}`,
    });

    // 3. CR VAT Payable - taxTotal
    if (parseFloat(invoice.taxTotal) > 0 && invoice.taxAccountId) {
      lines.push({
        accountId: invoice.taxAccountId,
        debit: 0,
        credit: parseFloat(invoice.taxTotal),
        description: `VAT on Sales Invoice #${invoice.invoiceNumber}`,
      });
    }

    // 4. If inventory impact, add COGS and Inventory lines per detail item
    if (invoice.isInventoryImpact) {
      for (const detail of invoice.details || []) {
        if (!detail.itemId) continue;
        const item = detail.item;
        if (!item || !item.inventoryAccountId || !item.expenseAccountId) continue;

        const quantity = parseFloat(detail.quantity) || 0;
        // Use weighted average cost from inventory balance if available
        const { InventoryBalance } = require('../models');
        const balance = await InventoryBalance.findOne({
          where: { tenantId, itemId: detail.itemId, warehouseId: invoice.warehouseId },
        });
        let avgCost = parseFloat(detail.costPrice) || parseFloat(item.costPrice) || 0;
        if (balance) {
          const currentQty = parseFloat(balance.quantityOnHand) || 0;
          const currentValue = parseFloat(balance.inventoryValue) || (currentQty * avgCost);
          avgCost = currentQty > 0 ? (currentValue / currentQty) : avgCost;
        }
        const totalCost = quantity * avgCost;

        if (totalCost <= 0) continue;

        // DR Cost of Goods Sold
        lines.push({
          accountId: item.expenseAccountId,
          debit: parseFloat(totalCost.toFixed(2)),
          credit: 0,
          description: `COGS - ${item.name || ''} for Invoice #${invoice.invoiceNumber}`,
        });

        // CR Inventory Asset
        lines.push({
          accountId: item.inventoryAccountId,
          debit: 0,
          credit: parseFloat(totalCost.toFixed(2)),
          description: `Inventory - ${item.name || ''} for Invoice #${invoice.invoiceNumber}`,
        });
      }
    }

    return lines;
  }

  /**
   * Process inventory impact: reduce stock from warehouse
   * Uses Weighted Average Cost for COGS calculation
   */
  static async processInventoryImpact(tenantId, invoice, userId, transaction) {
    const { InventoryTransaction, InventoryBalance } = require('../models');

    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;

      const item = detail.item;
      // Only process inventory items (items with inventoryAccountId)
      if (!item || !item.inventoryAccountId) continue;

      const quantity = parseFloat(detail.quantity);
      const costPrice = parseFloat(detail.costPrice) || parseFloat(item.costPrice) || 0;

      // Use weighted average cost from current inventory balance
      const balance = await InventoryBalance.findOne({
        where: { tenantId, itemId: detail.itemId, warehouseId: invoice.warehouseId },
        transaction,
      });

      let avgCost = costPrice;
      let newValue = 0;
      let newQty = 0;

      if (balance) {
        const currentQty = parseFloat(balance.quantityOnHand) || 0;
        const currentValue = parseFloat(balance.inventoryValue) || (currentQty * costPrice);
        avgCost = currentQty > 0 ? (currentValue / currentQty) : costPrice;
        newQty = currentQty - quantity;
        newValue = currentValue - (quantity * avgCost);

        await balance.update(
          { quantityOnHand: Math.max(0, newQty), inventoryValue: Math.max(0, newValue), updatedAt: new Date() },
          { transaction }
        );
      }

      // Create inventory transaction record (OUT)
      const totalCost = quantity * avgCost;
      await InventoryTransaction.create({
        tenantId,
        itemId: detail.itemId,
        warehouseId: invoice.warehouseId,
        transactionType: 'sale',
        referenceId: invoice.id,
        referenceType: 'SalesInvoice',
        referenceNumber: invoice.invoiceNumber,
        quantity: -quantity, // negative = out
        unitCost: avgCost,
        totalCost: totalCost,
        balanceAfter: balance ? Math.max(0, newQty) : 0,
        createdAt: new Date(),
      }, { transaction });

      // COGS is handled by the journal entry lines via buildJournalLines
      if (item.expenseAccountId && totalCost > 0) {
        // This is handled by the accounts in the JE
      }
    }
  }

  /**
   * Cancel invoice: Reverse journal entry + reverse inventory
   */
  static async cancel(tenantId, id, userId) {
    const existing = await SalesInvoiceRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }
    if (!['posted', 'partially_paid', 'overdue'].includes(existing.status)) {
      const error = new Error('Only posted or partially paid invoices can be cancelled');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      // Reverse inventory impact if applied
      if (existing.isInventoryImpact) {
        await SalesInvoiceService.reverseInventoryImpact(tenantId, existing, userId, t);
      }

      // Update status
      await SalesInvoiceRepository.updateStatus(tenantId, id, 'cancelled', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'CANCEL',
        entity: 'SalesInvoice',
        entityId: id,
        newValues: { status: 'cancelled' },
      }, t);

      await t.commit();

      const updated = await SalesInvoiceRepository.findById(tenantId, id);
      return SalesInvoiceDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Reverse inventory impact
   */
  static async reverseInventoryImpact(tenantId, invoice, userId, transaction) {
    const { InventoryTransaction, InventoryBalance } = require('../models');

    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;

      const item = detail.item;
      if (!item || !item.inventoryAccountId) continue;

      const quantity = parseFloat(detail.quantity);
      const costPrice = parseFloat(detail.costPrice) || parseFloat(item.costPrice) || 0;

      // Increase inventory balance back
      const balance = await InventoryBalance.findOne({
        where: { tenantId, itemId: detail.itemId, warehouseId: invoice.warehouseId },
        transaction,
      });

      if (balance) {
        const newQty = parseFloat(balance.quantityOnHand) + quantity;
        await balance.update(
          { quantityOnHand: newQty, updatedAt: new Date() },
          { transaction }
        );
      }

      // Create reversal transaction
      await InventoryTransaction.create({
        tenantId,
        itemId: detail.itemId,
        warehouseId: invoice.warehouseId,
        transactionType: 'sale_cancellation',
        referenceId: invoice.id,
        referenceType: 'SalesInvoice',
        referenceNumber: invoice.invoiceNumber,
        quantity: quantity, // positive = back in
        unitCost: costPrice,
        totalCost: quantity * costPrice,
        balanceAfter: balance ? parseFloat(balance.quantityOnHand) + quantity : quantity,
        createdAt: new Date(),
      }, { transaction });
    }
  }

  /**
   * Generate invoice number: INV-YYYY-NNNNN
   */
  static async generateInvoiceNumber(tenantId) {
    const { SalesInvoice } = require('../models');
    const year = new Date().getFullYear();
    const lastInvoice = await SalesInvoice.findOne({
      where: {
        tenantId,
        invoiceNumber: { [Op.like]: `INV-${year}-%` },
      },
      order: [['createdAt', 'DESC']],
      paranoid: false,
    });

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `INV-${year}-${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Generate invoice from Sales Order
   */
  static async generateFromSalesOrder(tenantId, salesOrderId, userId) {
    const { SalesOrder, SalesOrderDetail } = require('../models');

    const order = await SalesOrder.findOne({
      where: { tenantId, id: salesOrderId },
      include: [
        {
          model: SalesOrderDetail,
          as: 'details',
          include: [{ model: require('../models').Item, as: 'item' }],
        },
      ],
    });

    if (!order) {
      const error = new Error('Sales Order not found');
      error.status = 404;
      throw error;
    }
    if (!['approved', 'partially_delivered', 'delivered'].includes(order.status)) {
      const error = new Error('Sales Order must be approved or delivered to generate invoice');
      error.status = 400;
      throw error;
    }

    const invoiceNumber = await SalesInvoiceService.generateInvoiceNumber(tenantId);

    const body = {
      invoiceNumber,
      customerId: order.customerId,
      salesOrderId: order.id,
      warehouseId: order.warehouseId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isInventoryImpact: false, // Can be changed by user before posting
      details: (order.details || []).map((line) => ({
        itemId: line.itemId,
        description: line.description,
        quantity: parseFloat(line.quantity),
        unitPrice: parseFloat(line.unitPrice),
        taxPercent: parseFloat(line.taxPercent || 0),
        discountPercent: parseFloat(line.discountPercent || 0),
        lineTotal: parseFloat(line.quantity) * parseFloat(line.unitPrice),
        costPrice: parseFloat(line.costPrice || 0),
      })),
    };

    return SalesInvoiceService.create(tenantId, body, userId);
  }

  /**
   * Generate invoice from Delivery Note
   */
  static async generateFromDeliveryNote(tenantId, deliveryNoteId, userId) {
    const { DeliveryNote, DeliveryNoteDetail, Item } = require('../models');

    const deliveryNote = await DeliveryNote.findOne({
      where: { tenantId, id: deliveryNoteId },
      include: [
        {
          model: DeliveryNoteDetail,
          as: 'details',
          include: [{ model: Item, as: 'item' }],
        },
      ],
    });

    if (!deliveryNote) {
      const error = new Error('Delivery Note not found');
      error.status = 404;
      throw error;
    }
    if (deliveryNote.status !== 'delivered') {
      const error = new Error('Delivery Note must be delivered to generate invoice');
      error.status = 400;
      throw error;
    }

    const invoiceNumber = await SalesInvoiceService.generateInvoiceNumber(tenantId);

    const body = {
      invoiceNumber,
      customerId: deliveryNote.customerId,
      salesOrderId: deliveryNote.salesOrderId,
      deliveryNoteId: deliveryNote.id,
      warehouseId: deliveryNote.warehouseId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isInventoryImpact: false,
      details: (deliveryNote.details || []).map((line) => {
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unitPrice) || (line.item ? parseFloat(line.item.sellingPrice) : 0);
        const taxPct = parseFloat(line.taxPercentage || 0);
        const discPct = parseFloat(line.discountPercentage || 0);
        const gross = qty * price;
        const discAmt = gross * (discPct / 100);
        const taxAmt = (gross - discAmt) * (taxPct / 100);
        return {
          itemId: line.itemId,
          description: line.description || (line.item ? line.item.name : ''),
          quantity: qty,
          unitPrice: price,
          taxPercent: taxPct,
          discountPercent: discPct,
          lineTotal: parseFloat((gross - discAmt + taxAmt).toFixed(2)),
          costPrice: parseFloat(line.costPrice) || (line.item ? parseFloat(line.item.costPrice) : 0),
        };
      }),
    };

    return SalesInvoiceService.create(tenantId, body, userId);
  }
}

module.exports = SalesInvoiceService;