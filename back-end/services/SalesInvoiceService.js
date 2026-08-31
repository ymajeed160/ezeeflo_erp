'use strict';
const { sequelize } = require('../models');
const SalesInvoiceRepository = require('../repositories/SalesInvoiceRepository');
const SalesInvoiceDTO = require('../dto/SalesInvoiceDTO');
const InventoryTransactionService = require('./InventoryTransactionService');
const AuditService = require('./AuditService');
const { Op } = require('sequelize');
const { requireDeletionEnabled } = require('../utils/deletionSettings');

class SalesInvoiceService {
  /**
   * List invoices with pagination, filtering, sorting, searching
   */
  static async list(tenantId, query = {}) {
    query.includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === true;
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
  static async delete(tenantId, id, userId, reason = null) {
    const existing = await SalesInvoiceRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }
    await requireDeletionEnabled(tenantId, 'sales_invoices');
    if (existing.journalEntryId) {
      const error = new Error('This Sales Invoice is linked to a journal entry. Delete the journal entry first, then delete this invoice.');
      error.status = 400;
      throw error;
    }
    const t = await sequelize.transaction();
    try {
      const { SalesInvoice } = require('../models');
      await SalesInvoice.update(
        { deletedBy: userId, deleteReason: reason || null },
        { where: { tenantId, id }, transaction: t }
      );
      await SalesInvoiceRepository.softDeleteHeader(tenantId, id, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'SOFT_DELETE',
        entity: 'SalesInvoice',
        entityId: id,
        newValues: { deletedBy: userId, deleteReason: reason || null },
      }, t);

      await t.commit();
      return { message: 'Sales Invoice deleted successfully' };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Restore a soft-deleted draft invoice
   */
  static async restore(tenantId, id, userId) {
    const existing = await SalesInvoiceRepository.findById(tenantId, id, true);
    if (!existing) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }
    if (!existing.deletedAt) {
      const error = new Error('Sales Invoice is not deleted');
      error.status = 400;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft invoices can be restored');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      await SalesInvoiceRepository.restore(tenantId, id, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'RESTORE',
        entity: 'SalesInvoice',
        entityId: id,
        newValues: { restored: true },
      }, t);

      await t.commit();
      return SalesInvoiceDTO.toDetail(await SalesInvoiceRepository.findById(tenantId, id));
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
      // Auto-resolve posting accounts (customer A/R + revenue/VAT from System Config),
      // then apply any explicit overrides from the request body.
      await SalesInvoiceService._resolveAndSetAccounts(tenantId, id, existing, body, t);

      // Use existing (with resolved accounts) for posting
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
   * Resolve and persist the posting accounts for an invoice:
   * - Customer A/R  → Customer profile (arAccountId)
   * - Sales Revenue → System Config (accounting → revenue_account)
   * - VAT Payable   → System Config (accounting → vat_payable)
   * Explicit body values take precedence.
   */
  static async _resolveAndSetAccounts(tenantId, id, invoice, body, t) {
    const { Customer, SystemConfig } = require('../models');
    const resolved = {};

    // Customer A/R from customer profile
    if (!invoice.customerAccountId) {
      const customer = invoice.customer || (await Customer.findOne({ where: { id: invoice.customerId, tenantId }, transaction: t }));
      if (customer && customer.arAccountId) resolved.customerAccountId = customer.arAccountId;
    }

    // Sales Revenue from System Config
    if (!invoice.revenueAccountId) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'revenue_account' }, transaction: t });
      if (cfg && cfg.configValue) resolved.revenueAccountId = cfg.configValue;
    }

    // VAT Payable from System Config (only when tax exists)
    if (!invoice.taxAccountId && parseFloat(invoice.taxTotal) > 0) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'vat_payable' }, transaction: t });
      if (cfg && cfg.configValue) resolved.taxAccountId = cfg.configValue;
    }

    // Explicit overrides win
    if (body.customerAccountId) resolved.customerAccountId = body.customerAccountId;
    if (body.revenueAccountId) resolved.revenueAccountId = body.revenueAccountId;
    if (body.taxAccountId) resolved.taxAccountId = body.taxAccountId;

    if (Object.keys(resolved).length) {
      await SalesInvoiceRepository.update(tenantId, id, resolved, t);
      Object.assign(invoice, resolved);
    }
  }

  /**
   * Preview the resolved posting accounts for an invoice (for the confirm dialog).
   */
  static async getPostingPreview(tenantId, id) {
    const invoice = await SalesInvoiceRepository.findById(tenantId, id);
    if (!invoice) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }

    const { Customer, Account, SystemConfig } = require('../models');

    let customerAccountId = invoice.customerAccountId;
    if (!customerAccountId && invoice.customer && invoice.customer.arAccountId) customerAccountId = invoice.customer.arAccountId;
    if (!customerAccountId) {
      const c = await Customer.findOne({ where: { id: invoice.customerId, tenantId } });
      if (c && c.arAccountId) customerAccountId = c.arAccountId;
    }

    let revenueAccountId = invoice.revenueAccountId;
    if (!revenueAccountId) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'revenue_account' } });
      if (cfg && cfg.configValue) revenueAccountId = cfg.configValue;
    }

    let taxAccountId = invoice.taxAccountId;
    if (!taxAccountId && parseFloat(invoice.taxTotal) > 0) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'vat_payable' } });
      if (cfg && cfg.configValue) taxAccountId = cfg.configValue;
    }

    const ids = [customerAccountId, revenueAccountId, taxAccountId].filter(Boolean);
    const accounts = await Account.findAll({ where: { id: { [Op.in]: ids }, tenantId } });
    const byId = {};
    accounts.forEach((a) => { byId[a.id] = a; });
    const fmt = (aid) => (byId[aid] ? { id: byId[aid].id, code: byId[aid].code, name: byId[aid].name, type: byId[aid].type } : null);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: parseFloat(invoice.grandTotal),
      subTotal: parseFloat(invoice.subTotal),
      taxTotal: parseFloat(invoice.taxTotal),
      discountTotal: parseFloat(invoice.discountTotal),
      customer: invoice.customer ? { id: invoice.customer.id, name: invoice.customer.name } : null,
      customerAccount: fmt(customerAccountId),
      revenueAccount: fmt(revenueAccountId),
      taxAccount: fmt(taxAccountId),
    };
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
  static async cancel(tenantId, id, userId, reason = null) {
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

      // Reverse the posted journal entry (neutralize accounting effect)
      if (existing.journalEntryId) {
        const { JournalEntry, JournalEntryLine } = require('../models');
        const originalJE = await JournalEntry.findByPk(existing.journalEntryId, {
          include: [{ model: JournalEntryLine, as: 'lines' }],
          transaction: t,
        });
        if (originalJE && originalJE.lines && originalJE.lines.length > 0) {
          const reversalLines = originalJE.lines.map((line) => ({
            accountId: line.accountId,
            description: `Reversal: ${line.description}`,
            debit: line.credit,
            credit: line.debit,
          }));
          const JournalEntryService = require('./JournalEntryService');
          const reversalJE = await JournalEntryService.createEntry({
            tenantId,
            entryDate: new Date().toISOString().split('T')[0],
            reference: `VOID-${existing.invoiceNumber}`,
            description: `Cancellation of Sales Invoice ${existing.invoiceNumber}`,
            lines: reversalLines,
            source: 'SALES_INVOICE_CANCEL',
            sourceId: existing.id,
            isAutoGenerated: true,
          }, tenantId, userId, t);
          await JournalEntryService.postEntry(reversalJE.id, tenantId, userId, t);
        }
      }

      // Update status
      const { SalesInvoice } = require('../models');
      await SalesInvoice.update(
        { status: 'cancelled', cancelReason: reason || null, updatedBy: userId },
        { where: { tenantId, id }, transaction: t }
      );

      await AuditService.log({
        tenantId,
        userId,
        action: 'CANCEL',
        entity: 'SalesInvoice',
        entityId: id,
        newValues: { status: 'cancelled', cancelReason: reason || null },
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
   * Reverse inventory impact (add stock back) for a cancelled invoice
   */
  static async reverseInventoryImpact(tenantId, invoice, userId, transaction) {
    const { Item } = require('../models');

    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;

      const item = detail.item || (await Item.findOne({ where: { id: detail.itemId, tenantId }, transaction }));
      if (!item || !item.inventoryAccountId) continue;

      const quantity = parseFloat(detail.quantity || 0);
      if (quantity <= 0) continue;
      const costPrice = parseFloat(detail.costPrice || 0) || parseFloat(item.costPrice || 0);

      await InventoryTransactionService.recordTransaction({
        tenantId,
        itemId: detail.itemId,
        warehouseId: invoice.warehouseId,
        transactionType: 'return',
        referenceId: invoice.id,
        referenceType: 'SalesInvoiceCancel',
        referenceNumber: invoice.invoiceNumber,
        quantity, // positive = back in
        unitCost: costPrice,
        totalCost: quantity * costPrice,
      }, transaction);
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
  static async generateFromSalesOrder(tenantId, salesOrderId, userId, body = {}) {
    const { SalesOrder, SalesOrderDetail, Item } = require('../models');

    const order = await SalesOrder.findOne({
      where: { tenantId, id: salesOrderId },
      include: [
        {
          model: SalesOrderDetail,
          as: 'details',
          include: [{ model: Item, as: 'item' }],
        },
      ],
    });

    if (!order) {
      const error = new Error('Sales Order not found');
      error.status = 404;
      throw error;
    }
    if (!['approved', 'confirmed', 'partially_delivered', 'delivered', 'partially_invoiced'].includes(order.status)) {
      const error = new Error('Sales Order must be approved to generate invoice');
      error.status = 400;
      throw error;
    }

    const requestedLines = body.lines || body.details || null;
    const lineItems = [];
    let hasAny = false;

    for (const line of order.details || []) {
      const ordered = parseFloat(line.quantity);
      const invoiced = parseFloat(line.invoicedQuantity || 0);
      const remaining = ordered - invoiced;

      let qty = remaining;
      if (requestedLines) {
        const req = requestedLines.find((l) => l.salesOrderDetailId === line.id);
        if (!req) continue;
        qty = parseFloat(req.quantity || 0);
      }

      if (qty <= 0) continue;
      if (qty > remaining + 0.001) {
        const error = new Error(
          `Invoice quantity for ${line.item ? line.item.name : line.itemId} exceeds remaining order quantity. Remaining: ${remaining}`
        );
        error.status = 400;
        throw error;
      }

      hasAny = true;
      const price = parseFloat(line.unitPrice);
      const taxPct = parseFloat(line.taxPercentage || 0);
      const discPct = parseFloat(line.discountPercentage || 0);
      const gross = qty * price;
      const discAmt = gross * (discPct / 100);
      const taxAmt = (gross - discAmt) * (taxPct / 100);

      lineItems.push({
        salesOrderDetailId: line.id,
        itemId: line.itemId,
        description: line.description || (line.item ? line.item.name : ''),
        quantity: qty,
        unitPrice: price,
        taxPercent: taxPct,
        discountPercent: discPct,
        lineTotal: parseFloat((gross - discAmt + taxAmt).toFixed(2)),
        costPrice: parseFloat(line.costPrice || (line.item ? line.item.costPrice : 0)),
      });
    }

    if (!hasAny) {
      const error = new Error('No remaining quantity available to invoice');
      error.status = 400;
      throw error;
    }

    const invoiceNumber = await SalesInvoiceService.generateInvoiceNumber(tenantId);

    const newBody = {
      invoiceNumber,
      customerId: order.customerId,
      salesOrderId: order.id,
      warehouseId: order.warehouseId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isInventoryImpact: false,
      details: lineItems,
    };

    const result = await SalesInvoiceService.create(tenantId, newBody, userId);

    // Update sales order invoiced quantities and status
    const t = await sequelize.transaction();
    try {
      for (const li of lineItems) {
        const detail = order.details.find((d) => d.id === li.salesOrderDetailId);
        if (!detail) continue;
        const newInvoiced = parseFloat(detail.invoicedQuantity || 0) + parseFloat(li.quantity);
        await SalesOrderDetail.update(
          { invoicedQuantity: newInvoiced },
          { where: { id: detail.id, tenantId }, transaction: t }
        );
      }
      await t.commit();
    } catch (error) {
      await t.rollback();
      throw error;
    }

    await SalesInvoiceService._syncSalesOrderInvoiceStatus(tenantId, order.id);
    return result;
  }

  /**
   * Generate invoice from Delivery Note
   */
  static async generateFromDeliveryNote(tenantId, deliveryNoteId, userId, body = {}) {
    const { DeliveryNote, DeliveryNoteDetail, SalesInvoiceDetail, Item } = require('../models');

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

    const requestedLines = body.lines || body.details || null;
    const lineItems = [];
    let hasAny = false;

    for (const line of deliveryNote.details || []) {
      const delivered = parseFloat(line.quantity) || 0;

      // How much of this DN line has already been invoiced
      const alreadyInvoiced = await SalesInvoiceDetail.sum('quantity', {
        where: { tenantId, deliveryNoteDetailId: line.id },
      });
      const remaining = delivered - parseFloat(alreadyInvoiced || 0);

      let qty = remaining;
      if (requestedLines) {
        const req = requestedLines.find((l) => l.deliveryNoteDetailId === line.id);
        if (!req) continue;
        qty = parseFloat(req.quantity || 0);
      }

      if (qty <= 0) continue;
      if (qty > remaining + 0.001) {
        const error = new Error(
          `Invoice quantity for ${line.item ? line.item.name : line.itemId} exceeds remaining delivered quantity. Remaining: ${remaining}`
        );
        error.status = 400;
        throw error;
      }

      hasAny = true;
      const price = parseFloat(line.unitPrice) || (line.item ? parseFloat(line.item.sellingPrice) : 0);
      const taxPct = parseFloat(line.taxPercentage || 0);
      const discPct = parseFloat(line.discountPercentage || 0);
      const gross = qty * price;
      const discAmt = gross * (discPct / 100);
      const taxAmt = (gross - discAmt) * (taxPct / 100);

      lineItems.push({
        deliveryNoteDetailId: line.id,
        salesOrderDetailId: line.salesOrderDetailId || null,
        itemId: line.itemId,
        description: line.description || (line.item ? line.item.name : ''),
        quantity: qty,
        unitPrice: price,
        taxPercent: taxPct,
        discountPercent: discPct,
        lineTotal: parseFloat((gross - discAmt + taxAmt).toFixed(2)),
        costPrice: parseFloat(line.costPrice) || (line.item ? parseFloat(line.item.costPrice) : 0),
      });
    }

    if (!hasAny) {
      const error = new Error('No remaining delivered quantity available to invoice');
      error.status = 400;
      throw error;
    }

    const invoiceNumber = await SalesInvoiceService.generateInvoiceNumber(tenantId);

    const newBody = {
      invoiceNumber,
      customerId: deliveryNote.customerId,
      salesOrderId: deliveryNote.salesOrderId,
      deliveryNoteId: deliveryNote.id,
      warehouseId: deliveryNote.warehouseId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isInventoryImpact: false,
      details: lineItems,
    };

    const result = await SalesInvoiceService.create(tenantId, newBody, userId);

    // If the DN came from a sales order, sync that order's invoiced quantities/status too
    if (deliveryNote.salesOrderId) {
      await SalesInvoiceService._syncSalesOrderInvoiceStatus(tenantId, deliveryNote.salesOrderId);
    }

    return result;
  }

  /**
   * Recompute a sales order's invoiced quantity per line from its invoices,
   * then set partially_invoiced / fully_invoiced status.
   */
  static async _syncSalesOrderInvoiceStatus(tenantId, salesOrderId) {
    const { SalesOrder, SalesOrderDetail, SalesInvoiceDetail } = require('../models');

    const order = await SalesOrder.findOne({
      where: { tenantId, id: salesOrderId },
      include: [{ model: SalesOrderDetail, as: 'details' }],
    });
    if (!order) return;

    const detailIds = (order.details || []).map((d) => d.id);
    const totals = await SalesInvoiceDetail.findAll({
      where: { tenantId, salesOrderDetailId: { [Op.in]: detailIds } },
      attributes: ['salesOrderDetailId', [sequelize.fn('SUM', sequelize.col('quantity')), 'invoicedQty']],
      group: ['salesOrderDetailId'],
    });
    const invoicedByDetail = {};
    totals.forEach((t) => { invoicedByDetail[t.salesOrderDetailId] = parseFloat(t.get('invoicedQty') || 0); });

    let totalOrdered = 0;
    let totalInvoiced = 0;
    for (const d of order.details || []) {
      const inv = invoicedByDetail[d.id] || 0;
      totalOrdered += parseFloat(d.quantity);
      totalInvoiced += inv;
      if (parseFloat(d.invoicedQuantity || 0) !== inv) {
        await SalesOrderDetail.update({ invoicedQuantity: inv }, { where: { id: d.id, tenantId } });
      }
    }

    let status = order.status;
    if (totalInvoiced > 0 && totalInvoiced < totalOrdered) status = 'partially_invoiced';
    else if (totalInvoiced >= totalOrdered) status = 'fully_invoiced';

    if (status !== order.status) {
      await SalesOrder.update({ status }, { where: { id: salesOrderId, tenantId } });
    }
  }
}

module.exports = SalesInvoiceService;