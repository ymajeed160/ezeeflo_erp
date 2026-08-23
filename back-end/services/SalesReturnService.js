'use strict';
const { sequelize } = require('../models');
const SalesReturnRepository = require('../repositories/SalesReturnRepository');
const SalesReturnDTO = require('../dto/SalesReturnDTO');
const AuditService = require('./AuditService');
const InventoryTransactionService = require('./InventoryTransactionService');
const { Op } = require('sequelize');

class SalesReturnService {
  /**
   * List returns with pagination, filtering, sorting, searching
   */
  static async list(tenantId, query = {}) {
    const { data, count, page, limit, totalPages } = await SalesReturnRepository.findAll(tenantId, query);
    return {
      data: data.map(SalesReturnDTO.toList),
      count,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get return by ID
   */
  static async getById(tenantId, id) {
    const salesReturn = await SalesReturnRepository.findById(tenantId, id);
    if (!salesReturn) {
      const error = new Error('Sales Return not found');
      error.status = 404;
      throw error;
    }
    return SalesReturnDTO.toDetail(salesReturn);
  }

  /**
   * Create sales return with details, generate return number
   */
  static async create(tenantId, body, userId) {
    const t = await sequelize.transaction();
    try {
      // Generate return number if not provided
      if (!body.returnNumber) {
        body.returnNumber = await SalesReturnService.generateReturnNumber(tenantId);
      }

      // If originating from a sales invoice, derive customer + warehouse and validate ownership
      if (body.salesInvoiceId) {
        const { SalesInvoice } = require('../models');
        const invoice = await SalesInvoice.findOne({ where: { id: body.salesInvoiceId, tenantId }, transaction: t });
        if (!invoice) {
          const error = new Error('Sales Invoice not found');
          error.status = 404;
          throw error;
        }
        if (invoice.customerId !== body.customerId) {
          const error = new Error('Sales Invoice does not belong to the selected customer');
          error.status = 400;
          throw error;
        }
        body.customerId = invoice.customerId;
        if (!body.warehouseId) body.warehouseId = invoice.warehouseId || null;
      }

      const data = SalesReturnDTO.toCreate(body, tenantId, userId);
      const salesReturn = await SalesReturnRepository.create(data, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'CREATE',
        entity: 'SalesReturn',
        entityId: salesReturn.id,
        newValues: { returnNumber: salesReturn.returnNumber, grandTotal: salesReturn.grandTotal },
      }, t);

      await t.commit();
      return SalesReturnDTO.toDetail(salesReturn);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Update sales return (only draft returns can be updated)
   */
  static async update(tenantId, id, body, userId) {
    const existing = await SalesReturnRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Return not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft returns can be updated');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      const data = SalesReturnDTO.toUpdate(body, userId);
      const updated = await SalesReturnRepository.update(tenantId, id, data, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'UPDATE',
        entity: 'SalesReturn',
        entityId: id,
        oldValues: { grandTotal: existing.grandTotal },
        newValues: { grandTotal: updated.grandTotal },
      }, t);

      await t.commit();
      return SalesReturnDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Delete sales return (only draft)
   */
  static async delete(tenantId, id) {
    const existing = await SalesReturnRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Return not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft returns can be deleted');
      error.status = 400;
      throw error;
    }
    const t = await sequelize.transaction();
    try {
      await SalesReturnRepository.delete(tenantId, id, t);
      await t.commit();
      return { message: 'Sales Return deleted successfully' };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Approve sales return: Just update status (no accounting)
   * Use Post for accounting + inventory impact
   */
  static async approve(tenantId, id, userId) {
    const existing = await SalesReturnRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Return not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft returns can be approved');
      error.status = 400;
      throw error;
    }

    await SalesReturnRepository.updateStatus(tenantId, id, 'approved', userId);
    return SalesReturnDTO.toDetail(await SalesReturnRepository.findById(tenantId, id));
  }

  /**
   * Reject sales return
   */
  static async reject(tenantId, id, userId) {
    const existing = await SalesReturnRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Return not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft returns can be rejected');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      await SalesReturnRepository.updateStatus(tenantId, id, 'rejected', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'REJECT',
        entity: 'SalesReturn',
        entityId: id,
        newValues: { status: 'rejected' },
      }, t);

      await t.commit();

      const updated = await SalesReturnRepository.findById(tenantId, id);
      return SalesReturnDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Confirm & Post: atomically resolve accounts, create journal entry (posted),
   * reverse inventory impact, and mark the return posted. Backend is the authority.
   */
  static async post(tenantId, id, userId, body = {}) {
    const existing = await SalesReturnRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Return not found');
      error.status = 404;
      throw error;
    }
    if (existing.status === 'posted') {
      const error = new Error('This Sales Return has already been posted.');
      error.status = 400;
      throw error;
    }
    if (existing.journalEntryId) {
      const error = new Error('This Sales Return already has a journal entry.');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      // 1. Validate invoice ownership + quantities (backend authority)
      await SalesReturnService._validateInvoiceAndQuantities(tenantId, existing, t);

      // 2. Resolve accounting accounts from source-of-truth config
      await SalesReturnService._resolveAndSetAccounts(tenantId, id, existing, body, t);

      // 3. Validate accounts
      await SalesReturnService.validatePostingAccounts(tenantId, existing);

      // 4. Build + create journal entry (auto-generated, then posted)
      const JournalEntryService = require('./JournalEntryService');
      const journalLines = await SalesReturnService.buildPostJournalLines(tenantId, existing);

      const journalEntry = await JournalEntryService.createEntry({
        tenantId,
        entryDate: existing.returnDate,
        reference: `SR-${existing.returnNumber}`,
        description: `Sales Return #${existing.returnNumber} - Customer: ${existing.customer ? existing.customer.name : ''}`,
        source: 'SALES_RETURN',
        sourceId: existing.id,
        isAutoGenerated: true,
        lines: journalLines,
      }, tenantId, userId, t);

      await JournalEntryService.postEntry(journalEntry.id, tenantId, userId, t);

      // 5. Link journal entry to return
      await SalesReturnRepository.setJournalEntry(tenantId, id, journalEntry.id, t);

      // 6. Reverse inventory impact (increase stock) if applicable
      if (existing.isInventoryImpact) {
        await SalesReturnService.processInventoryImpact(tenantId, existing, userId, t);
      }

      // 7. Mark posted
      await SalesReturnRepository.updateStatus(tenantId, id, 'posted', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'POST',
        entity: 'SalesReturn',
        entityId: id,
        newValues: {
          status: 'posted',
          journalEntryId: journalEntry.id,
          customerAccountId: existing.customerAccountId,
          revenueAccountId: existing.revenueAccountId,
          taxAccountId: existing.taxAccountId,
        },
      }, t);

      await t.commit();

      const updated = await SalesReturnRepository.findById(tenantId, id);
      return SalesReturnDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Validate invoice relationship + return quantities (backend authority).
   */
  static async _validateInvoiceAndQuantities(tenantId, salesReturn, t) {
    const { SalesInvoice, SalesInvoiceDetail } = require('../models');

    if (!salesReturn.salesInvoiceId) {
      throw new Error('Sales Return must originate from a Sales Invoice.');
    }

    const invoice = await SalesInvoice.findOne({ where: { id: salesReturn.salesInvoiceId, tenantId }, transaction: t });
    if (!invoice) {
      throw new Error('Sales Invoice not found.');
    }
    if (invoice.customerId !== salesReturn.customerId) {
      throw new Error('Sales Invoice does not belong to the selected customer.');
    }
    if (!['posted', 'paid', 'partially_paid', 'overdue'].includes(invoice.status)) {
      throw new Error('Only posted sales invoices can be returned.');
    }

    const returned = await SalesReturnService._getReturnedQuantities(tenantId, invoice.id, t, salesReturn.id);

    for (const detail of salesReturn.details || []) {
      const qty = parseFloat(detail.quantity || 0);
      if (qty <= 0) continue;

      const invLine = detail.salesInvoiceDetailId
        ? await SalesInvoiceDetail.findOne({ where: { id: detail.salesInvoiceDetailId, tenantId, salesInvoiceId: invoice.id }, transaction: t })
        : null;

      if (!invLine) {
        // Fall back to item-level availability
        const itemLines = await SalesInvoiceDetail.findAll({
          where: { salesInvoiceId: invoice.id, tenantId, itemId: detail.itemId },
          transaction: t,
        });
        const totalInvoiced = itemLines.reduce((s, l) => s + parseFloat(l.quantity || 0), 0);
        const alreadyReturned = parseFloat(returned.byItem[detail.itemId] || 0);
        const remaining = Math.max(0, parseFloat((totalInvoiced - alreadyReturned).toFixed(4)));
        if (qty > remaining + 0.0001) {
          const itemName = detail.item ? detail.item.name : detail.itemId;
          throw new Error(`Return quantity cannot exceed the remaining returnable quantity (${remaining}) for item "${itemName}".`);
        }
        continue;
      }

      const invoicedQty = parseFloat(invLine.quantity || 0);
      const alreadyReturned = parseFloat(returned.byLine[invLine.id] || 0);
      const remaining = Math.max(0, parseFloat((invoicedQty - alreadyReturned).toFixed(4)));
      if (qty > remaining + 0.0001) {
        const itemName = detail.item ? detail.item.name : invLine.id;
        throw new Error(`Return quantity cannot exceed the remaining returnable quantity (${remaining}) for "${itemName}".`);
      }
    }
  }

  /**
   * Resolve and persist posting accounts from source-of-truth configuration.
   */
  static async _resolveAndSetAccounts(tenantId, id, salesReturn, body, t) {
    const { Customer, SystemConfig } = require('../models');
    const resolved = {};

    // Customer A/R from customer profile
    if (!salesReturn.customerAccountId) {
      const customer = salesReturn.customer || (await Customer.findOne({ where: { id: salesReturn.customerId, tenantId }, transaction: t }));
      if (!customer) throw new Error('Customer not found');
      if (!customer.arAccountId) throw new Error(`Customer ${customer.name} is not linked to a Chart of Account.`);
      resolved.customerAccountId = customer.arAccountId;
    }

    // Sales Revenue from System Config
    if (!salesReturn.revenueAccountId) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'revenue_account' }, transaction: t });
      if (!cfg || !cfg.configValue) throw new Error('Sales Revenue account is not configured in System Configuration.');
      resolved.revenueAccountId = cfg.configValue;
    }

    // VAT Payable from System Config (when VAT exists)
    if (!salesReturn.taxAccountId && parseFloat(salesReturn.taxTotal) > 0) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'vat_payable' }, transaction: t });
      if (!cfg || !cfg.configValue) throw new Error('VAT account is not configured.');
      resolved.taxAccountId = cfg.configValue;
    }

    if (Object.keys(resolved).length) {
      await SalesReturnRepository.update(tenantId, id, resolved, t);
      Object.assign(salesReturn, resolved);
    }
  }

  /**
   * Preview the resolved posting accounts for the confirmation popup.
   */
  static async getPostingPreview(tenantId, id) {
    const salesReturn = await SalesReturnRepository.findById(tenantId, id);
    if (!salesReturn) {
      const error = new Error('Sales Return not found');
      error.status = 404;
      throw error;
    }

    const { Customer, Account, SystemConfig } = require('../models');

    let customerAccountId = salesReturn.customerAccountId;
    if (!customerAccountId && salesReturn.customer && salesReturn.customer.arAccountId) customerAccountId = salesReturn.customer.arAccountId;
    if (!customerAccountId) {
      const c = await Customer.findOne({ where: { id: salesReturn.customerId, tenantId } });
      if (c && c.arAccountId) customerAccountId = c.arAccountId;
    }

    let revenueAccountId = salesReturn.revenueAccountId;
    if (!revenueAccountId) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'revenue_account' } });
      if (cfg && cfg.configValue) revenueAccountId = cfg.configValue;
    }

    let taxAccountId = salesReturn.taxAccountId;
    if (!taxAccountId && parseFloat(salesReturn.taxTotal) > 0) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'vat_payable' } });
      if (cfg && cfg.configValue) taxAccountId = cfg.configValue;
    }

    const ids = [customerAccountId, revenueAccountId, taxAccountId].filter(Boolean);
    const accounts = await Account.findAll({ where: { id: { [Op.in]: ids }, tenantId } });
    const byId = {};
    accounts.forEach((a) => { byId[a.id] = a; });
    const fmt = (aid) => (byId[aid] ? { id: byId[aid].id, code: byId[aid].code, name: byId[aid].name, type: byId[aid].type } : null);

    return {
      id: salesReturn.id,
      returnNumber: salesReturn.returnNumber,
      customer: salesReturn.customer ? { id: salesReturn.customer.id, name: salesReturn.customer.name } : null,
      subTotal: parseFloat(salesReturn.subTotal || 0),
      taxTotal: parseFloat(salesReturn.taxTotal || 0),
      discountTotal: parseFloat(salesReturn.discountTotal || 0),
      grandTotal: parseFloat(salesReturn.grandTotal || 0),
      customerAccount: fmt(customerAccountId),
      revenueAccount: fmt(revenueAccountId),
      taxAccount: fmt(taxAccountId),
    };
  }

  /**
   * List posted sales invoices available for return for a customer.
   */
  static async listInvoicesForReturn(tenantId, customerId) {
    if (!customerId) {
      return { data: [] };
    }
    const { SalesInvoice, SalesInvoiceDetail } = require('../models');
    const invoices = await SalesInvoice.findAll({
      where: {
        tenantId,
        customerId,
        status: { [Op.in]: ['posted', 'paid', 'partially_paid', 'overdue'] },
      },
      order: [['createdAt', 'DESC']],
    });

    const result = [];
    for (const inv of invoices) {
      const details = await SalesInvoiceDetail.findAll({
        where: { salesInvoiceId: inv.id, tenantId },
        attributes: ['id', 'itemId', 'quantity'],
      });
      const returned = await SalesReturnService._getReturnedQuantities(tenantId, inv.id, null);
      const invoicedTotal = parseFloat(inv.grandTotal) || 0;
      let remainingQty = 0;
      let invoicedQty = 0;
      for (const d of details) {
        const invQty = parseFloat(d.quantity || 0);
        const retQty = parseFloat(returned.byLine[d.id] || 0) + parseFloat(returned.byItem[d.itemId] || 0);
        invoicedQty += invQty;
        remainingQty += Math.max(0, parseFloat((invQty - retQty).toFixed(4)));
      }
      const returnableTotal = invoicedQty > 0 ? invoicedTotal * remainingQty / invoicedQty : 0;
      const returnedTotal = invoicedQty > 0 ? invoicedTotal - returnableTotal : 0;

      result.push({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        grandTotal: invoicedTotal,
        returnedTotal: parseFloat(returnedTotal.toFixed(2)),
        returnableTotal: parseFloat(returnableTotal.toFixed(2)),
        status: inv.status,
      });
    }

    return { data: result.filter((r) => r.returnableTotal > 0.009) };
  }

  /**
   * Get returnable lines for a sales invoice (invoice header + line-level quantities).
   */
  static async getReturnableInvoiceLines(tenantId, invoiceId) {
    const { SalesInvoice, SalesInvoiceDetail, Customer, Warehouse, Item } = require('../models');
    const invoice = await SalesInvoice.findOne({
      where: { id: invoiceId, tenantId },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'code'] },
        { model: Warehouse, as: 'warehouse', attributes: ['id', 'name', 'code'], required: false },
      ],
    });
    if (!invoice) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }

    const details = await SalesInvoiceDetail.findAll({
      where: { salesInvoiceId: invoiceId, tenantId },
      include: [{ model: Item, as: 'item', attributes: ['id', 'name', 'itemCode', 'itemType', 'incomeAccountId', 'inventoryAccountId', 'expenseAccountId', 'costPrice'], required: false }],
      order: [['createdAt', 'ASC']],
    });

    const returned = await SalesReturnService._getReturnedQuantities(tenantId, invoiceId, null);

    const lines = details.map((line) => {
      const invoicedQty = parseFloat(line.quantity || 0);
      const returnedQty = parseFloat(returned.byLine[line.id] || 0) + parseFloat(returned.byItem[line.itemId] || 0);
      const remainingQty = Math.max(0, parseFloat((invoicedQty - returnedQty).toFixed(4)));
      return {
        salesInvoiceDetailId: line.id,
        itemId: line.itemId,
        itemName: line.item ? line.item.name : '',
        itemCode: line.item ? line.item.itemCode : '',
        itemType: line.item ? line.item.itemType : null,
        description: line.description || '',
        invoicedQty,
        returnedQty: parseFloat(returnedQty.toFixed(4)),
        remainingQty,
        unitPrice: parseFloat(line.unitPrice || 0),
        taxPercent: parseFloat(line.taxPercent || 0),
        discountPercent: parseFloat(line.discountPercent || 0),
        costPrice: parseFloat(line.costPrice || 0),
        lineTotal: parseFloat(line.lineTotal || 0),
      };
    });

    return {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        customerId: invoice.customerId,
        customerName: invoice.customer ? invoice.customer.name : '',
        warehouseId: invoice.warehouseId,
        warehouseName: invoice.warehouse ? invoice.warehouse.name : '',
        status: invoice.status,
        subTotal: parseFloat(invoice.subTotal || 0),
        taxTotal: parseFloat(invoice.taxTotal || 0),
        discountTotal: parseFloat(invoice.discountTotal || 0),
        grandTotal: parseFloat(invoice.grandTotal || 0),
      },
      lines,
    };
  }

  /**
   * Compute previously-returned quantities for an invoice, keyed by invoice line id
   * and item id, across all POSTED/APPROVED sales returns (optionally excluding one).
   */
  static async _getReturnedQuantities(tenantId, invoiceId, txn, excludeReturnId = null) {
    const { SalesReturn, SalesReturnDetail } = require('../models');
    const where = {
      tenantId,
      salesInvoiceId: invoiceId,
      status: { [Op.in]: ['posted', 'approved'] },
    };
    if (excludeReturnId) where.id = { [Op.ne]: excludeReturnId };

    const returnIds = await SalesReturn.findAll({
      where,
      attributes: ['id'],
      transaction: txn,
      raw: true,
    }).then((rows) => rows.map((r) => r.id));

    const result = { byLine: {}, byItem: {} };
    if (!returnIds.length) return result;

    const details = await SalesReturnDetail.findAll({
      where: { salesReturnId: { [Op.in]: returnIds } },
      attributes: ['salesInvoiceDetailId', 'itemId', 'quantity'],
      transaction: txn,
      raw: true,
    });

    for (const d of details) {
      const q = parseFloat(d.quantity || 0);
      if (d.salesInvoiceDetailId) {
        result.byLine[d.salesInvoiceDetailId] = (result.byLine[d.salesInvoiceDetailId] || 0) + q;
      } else {
        result.byItem[d.itemId] = (result.byItem[d.itemId] || 0) + q;
      }
    }
    return result;
  }

  /**
   * Validate posting accounts for sales return
   */
  static async validatePostingAccounts(tenantId, salesReturn) {
    const { Account } = require('../models');

    // Customer Account (AR) is required
    if (!salesReturn.customerAccountId) {
      throw new Error('Customer Account (Accounts Receivable) is required for posting');
    }
    const arAccount = await Account.findOne({
      where: { id: salesReturn.customerAccountId, tenantId, isActive: true },
    });
    if (!arAccount) {
      throw new Error('Customer Account is invalid, inactive, or belongs to a different tenant');
    }

    // Revenue Account is required
    if (!salesReturn.revenueAccountId) {
      throw new Error('Sales Return/Revenue Account is required for posting');
    }
    const revAccount = await Account.findOne({
      where: { id: salesReturn.revenueAccountId, tenantId, isActive: true },
    });
    if (!revAccount) {
      throw new Error('Revenue Account is invalid, inactive, or belongs to a different tenant');
    }

    // Tax Account is required when tax exists
    if (parseFloat(salesReturn.taxTotal) > 0) {
      if (!salesReturn.taxAccountId) {
        throw new Error('Tax Account (VAT Payable) is required because this return has tax amount');
      }
      const taxAccount = await Account.findOne({
        where: { id: salesReturn.taxAccountId, tenantId, isActive: true },
      });
      if (!taxAccount) {
        throw new Error('Tax Account is invalid, inactive, or belongs to a different tenant');
      }
    }
  }

  /**
   * Build journal entry lines for sales return posting using explicit accounts
   *
   * DR Sales Return/Revenue Account (revenueAccountId) - Sub Total (net of discounts)
   * DR Tax Account (taxAccountId) - Tax Total
   * CR Customer Account (customerAccountId) - Grand Total
   *
   * If Inventory Impact is enabled:
   * DR Inventory Asset (Item inventoryAccountId)
   * CR Cost of Goods Sold (Item expenseAccountId)
   */
  static async buildPostJournalLines(tenantId, salesReturn) {
    const lines = [];

    // 1. DR Sales Return/Revenue - subtotal (net of discounts)
    const subTotal = parseFloat(salesReturn.subTotal || 0);
    const discountTotal = parseFloat(salesReturn.discountTotal || 0);
    const netAmount = subTotal - discountTotal;

    lines.push({
      accountId: salesReturn.revenueAccountId,
      debit: parseFloat(netAmount.toFixed(2)),
      credit: 0,
      description: `Sales Return #${salesReturn.returnNumber}`,
    });

    // 2. DR Tax Account - taxTotal
    if (parseFloat(salesReturn.taxTotal) > 0 && salesReturn.taxAccountId) {
      lines.push({
        accountId: salesReturn.taxAccountId,
        debit: parseFloat(salesReturn.taxTotal),
        credit: 0,
        description: `VAT reversal on Sales Return #${salesReturn.returnNumber}`,
      });
    }

    // 3. CR Customer Account (AR) - grandTotal
    lines.push({
      accountId: salesReturn.customerAccountId,
      debit: 0,
      credit: parseFloat(salesReturn.grandTotal),
      description: `Sales Return #${salesReturn.returnNumber}`,
    });

    // 4. If inventory impact, reverse COGS and Inventory
    //    (add stock back: DR Inventory, CR COGS)
    if (salesReturn.isInventoryImpact) {
      for (const detail of salesReturn.details || []) {
        if (!detail.itemId) continue;
        const item = detail.item;
        if (!item || !item.inventoryAccountId || !item.expenseAccountId) continue;

        const quantity = parseFloat(detail.quantity) || 0;
        const costPrice = parseFloat(detail.costPrice) || parseFloat(item.costPrice) || 0;
        const totalCost = quantity * costPrice;

        if (totalCost <= 0) continue;

        // DR Inventory Asset (stock comes back)
        lines.push({
          accountId: item.inventoryAccountId,
          debit: parseFloat(totalCost.toFixed(2)),
          credit: 0,
          description: `Inventory - ${item.name || ''} for Return #${salesReturn.returnNumber}`,
        });

        // CR Cost of Goods Sold (COGS reversed)
        lines.push({
          accountId: item.expenseAccountId,
          debit: 0,
          credit: parseFloat(totalCost.toFixed(2)),
          description: `COGS reversal - ${item.name || ''} for Return #${salesReturn.returnNumber}`,
        });
      }
    }

    return lines;
  }

  /**
   * Process inventory impact: add stock back to the return warehouse.
   * Only product items (items with inventoryAccountId) are processed; service items skip.
   */
  static async processInventoryImpact(tenantId, salesReturn, userId, transaction) {
    const { Item } = require('../models');

    for (const detail of salesReturn.details || []) {
      if (!detail.itemId) continue;

      const item = detail.item || (await Item.findOne({ where: { id: detail.itemId, tenantId }, transaction }));
      if (!item || !item.inventoryAccountId) continue; // service items: no inventory movement

      const quantity = parseFloat(detail.quantity || 0);
      if (quantity <= 0) continue;
      const costPrice = parseFloat(detail.costPrice || 0) || parseFloat(item.costPrice || 0);

      await InventoryTransactionService.recordTransaction({
        tenantId,
        itemId: detail.itemId,
        warehouseId: salesReturn.warehouseId,
        transactionType: 'return',
        referenceId: salesReturn.id,
        referenceType: 'SalesReturn',
        referenceNumber: salesReturn.returnNumber,
        quantity, // positive = back in
        unitCost: costPrice,
        totalCost: quantity * costPrice,
      }, transaction);
    }
  }

  /**
   * Generate return number: SR-YYYY-NNNNN
   */
  static async generateReturnNumber(tenantId) {
    const { SalesReturn } = require('../models');
    const year = new Date().getFullYear();
    const lastReturn = await SalesReturn.findOne({
      where: {
        tenantId,
        returnNumber: { [Op.like]: `SR-${year}-%` },
      },
      order: [['createdAt', 'DESC']],
      paranoid: false,
    });

    let nextNumber = 1;
    if (lastReturn && lastReturn.returnNumber) {
      const parts = lastReturn.returnNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `SR-${year}-${String(nextNumber).padStart(5, '0')}`;
  }
}

module.exports = SalesReturnService;