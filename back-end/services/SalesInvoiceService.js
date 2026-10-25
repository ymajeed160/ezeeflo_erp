'use strict';
const { sequelize } = require('../models');
const SalesInvoiceRepository = require('../repositories/SalesInvoiceRepository');
const SalesInvoiceDTO = require('../dto/SalesInvoiceDTO');
const InventoryTransactionService = require('./InventoryTransactionService');
const FifoCostService = require('./FifoCostService');
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
   * Warehouse is mandatory when a document contains inventory-tracked products.
   */
  static async assertWarehouseForStockLines(tenantId, warehouseId, details) {
    const { Item } = require('../models');
    const { BadRequestError } = require('../utils/appError');
    const ids = [...new Set((details || []).map((d) => d.itemId).filter(Boolean))];
    if (!ids.length) return;
    const items = await Item.findAll({
      where: { id: { [Op.in]: ids }, tenantId },
      attributes: ['id', 'itemType', 'isInventoryTracked'],
    });
    const hasStockItem = items.some((i) => i.itemType === 'product' && i.isInventoryTracked !== false);
    if (hasStockItem && !warehouseId) {
      throw new BadRequestError('Warehouse is required for inventory items. Please select a warehouse.');
    }
  }

  /**
   * Create invoice with details, generate invoice number
   */
  static async create(tenantId, body, userId) {
    await SalesInvoiceService.assertWarehouseForStockLines(tenantId, body.warehouseId, body.details);
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

    await SalesInvoiceService.assertWarehouseForStockLines(
      tenantId,
      body.warehouseId !== undefined ? body.warehouseId : existing.warehouseId,
      body.details
    );

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

    // Posting inventory without a warehouse would corrupt stock records.
    const hasTrackedProduct = (existing.details || []).some(
      (d) => d.item && d.item.itemType === 'product' && d.item.isInventoryTracked !== false
    );
    if (hasTrackedProduct && !existing.warehouseId) {
      const { BadRequestError } = require('../utils/appError');
      throw new BadRequestError(
        'Warehouse is required to post this invoice because it reduces stock. Select a warehouse on the invoice and try again.'
      );
    }

    const t = await sequelize.transaction();
    try {
      // Auto-resolve posting accounts (customer A/R + revenue/VAT from System Config),
      // then apply any explicit overrides from the request body.
      await SalesInvoiceService._resolveAndSetAccounts(tenantId, id, existing, body, t);

      const invoice = existing;
      const selectionMap = new Map();
      if (Array.isArray(body.details)) {
        for (const line of body.details) {
          const manualAllocations = Array.isArray(line.manualAllocations)
            ? line.manualAllocations
            : Array.isArray(line.costLayerAllocations)
              ? line.costLayerAllocations
              : [];
          if (line.id && manualAllocations.length) {
            selectionMap.set(line.id, manualAllocations);
          }
        }
      }
      // Fall back to the user's saved source selection when the post request
      // does not re-supply it (e.g. posting from the list view). The persisted
      // selection is read back from the invoice line and re-validated at
      // consumption time, so a stale or unavailable layer is rejected.
      for (const detail of invoice.details || []) {
        if (selectionMap.has(detail.id)) continue;
        const persisted = detail.manualAllocations || detail.costLayerAllocations;
        if (Array.isArray(persisted) && persisted.length) {
          selectionMap.set(detail.id, persisted);
        }
      }
      for (const detail of invoice.details || []) {
        const manual = selectionMap.get(detail.id);
        if (manual) {
          detail.manualAllocations = manual;
        }
      }

      // Validate accounts before posting
      await SalesInvoiceService.validatePostingAccounts(tenantId, invoice);

      // 1. FIFO stock consumption (or manual GRN selection, when supplied) — locks cost
      //    layers, validates availability, persists per-line allocations and stock-out
      //    transactions. This is the authoritative source for COGS / Inventory amounts.
      const allocationsByDetail = await FifoCostService.consumeInvoiceStock(tenantId, invoice, t);

      // 2. Create Journal Entry from the persisted FIFO allocations
      const JournalEntryService = require('./JournalEntryService');
      const journalLines = await SalesInvoiceService.buildJournalLines(tenantId, invoice, allocationsByDetail);

      const journalEntry = await JournalEntryService.createEntry({
        tenantId,
        entryDate: invoice.invoiceDate,
        reference: invoice.invoiceNumber,
        description: `Sales Invoice #${invoice.invoiceNumber} - Customer: ${invoice.customer ? invoice.customer.name : ''}`,
        lines: journalLines,
        source: 'SALES_INVOICE',
        sourceId: invoice.id,
        isAutoGenerated: true,
      }, tenantId, userId, t);

      // Post immediately so the entry appears in the General Ledger
      await JournalEntryService.postEntry(journalEntry.id, tenantId, userId, t);

      // Link journal entry to invoice
      await SalesInvoiceRepository.setJournalEntry(tenantId, id, journalEntry.id, t);

      // 3. Update status to posted
      await SalesInvoiceRepository.updateStatus(tenantId, id, 'posted', userId, t);

      // 4. Analytical resource-income attribution (reporting only — NO accounting impact)
      if (invoice.sellingResourceId) {
        const ResourceIncomeService = require('./ResourceIncomeService');
        await ResourceIncomeService.syncForInvoice(invoice, t);
      }

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
   * Revert a posted sales invoice to Draft so it can be edited.
   *
   * Removes the accounting posting that belongs to this invoice only:
   *   - verifies the journal entry is the auto-generated one for this invoice
   *   - reverses the inventory (stock) movement
   *   - soft-deletes the journal entry + its lines (so the General Ledger no
   *     longer includes them)
   *   - clears the invoice's journal link and sets status back to 'draft'
   * Everything runs in one transaction, so a failure leaves no partial state.
   */
  static async unpostForEdit(tenantId, id, userId, options = {}) {
    const { BadRequestError } = require('../utils/appError');
    const { JournalEntry, JournalEntryLine } = require('../models');
    // When the journal entry was already deleted from the Journal Entries page,
    // only the invoice-side cleanup (stock + status) is required.
    const journalAlreadyDeleted = options.journalAlreadyDeleted === true;

    const invoice = await SalesInvoiceRepository.findById(tenantId, id);
    if (!invoice) {
      const error = new Error('Sales Invoice not found');
      error.status = 404;
      throw error;
    }
    if (invoice.status === 'draft') {
      return SalesInvoiceDTO.toDetail(invoice);
    }
    if (!['posted', 'partially_paid', 'overdue'].includes(invoice.status)) {
      throw new BadRequestError(`A ${invoice.status} invoice cannot be reverted to draft.`);
    }
    if (!journalAlreadyDeleted && !invoice.journalEntryId) {
      throw new BadRequestError(
        'This invoice is posted but has no linked journal entry. Resolve the accounting inconsistency before editing.'
      );
    }

    const t = await sequelize.transaction();
    try {
      let journalEntry = null;
      if (!journalAlreadyDeleted) {
        journalEntry = await JournalEntry.findOne({
          where: { id: invoice.journalEntryId, tenantId },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!journalEntry) {
          throw new BadRequestError(
            'The journal entry linked to this invoice could not be found. Resolve the accounting inconsistency before editing.'
          );
        }

        // Safety: only remove the entry this invoice created.
        const belongsToInvoice =
          (journalEntry.source === 'SALES_INVOICE' && journalEntry.sourceId === invoice.id) ||
          journalEntry.reference === invoice.invoiceNumber;
        if (!belongsToInvoice) {
          throw new BadRequestError(
            'The linked journal entry does not belong to this invoice. It was not removed.'
          );
        }
        if (!journalEntry.isAutoGenerated) {
          throw new BadRequestError(
            'The linked journal entry was created manually and cannot be removed automatically.'
          );
        }
      }

      // Put the stock back before invalidating the posting.
      await SalesInvoiceService.reverseInventoryImpact(tenantId, invoice, userId, t);

      if (!journalAlreadyDeleted) {
        // Soft-delete the journal lines and header (same convention as deleteEntry),
        // inside our transaction so the whole revert is atomic.
        const now = new Date();
        await JournalEntryLine.update(
          { deletedAt: now, deletedBy: userId },
          { where: { journalEntryId: journalEntry.id, tenantId, deletedAt: null }, paranoid: false, transaction: t }
        );
        await JournalEntry.update(
          {
            deletedAt: now,
            deletedBy: userId,
            deleteReason: `Sales Invoice ${invoice.invoiceNumber} reverted to draft for editing`,
          },
          { where: { id: journalEntry.id, tenantId }, paranoid: false, transaction: t }
        );
      }

      await SalesInvoiceRepository.setJournalEntry(tenantId, id, null, t);
      await SalesInvoiceRepository.updateStatus(tenantId, id, 'draft', userId, t);

      if (invoice.sellingResourceId) {
        const ResourceIncomeService = require('./ResourceIncomeService');
        await ResourceIncomeService.cancelForInvoice(invoice, t);
      }

      await AuditService.log({
        tenantId,
        userId,
        action: 'UNPOST',
        entity: 'SalesInvoice',
        entityId: id,
        oldValues: { status: invoice.status, journalEntryId: invoice.journalEntryId },
        newValues: { status: 'draft', journalEntryId: null },
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
   * - VAT Payable   → System Config (accounting → vat_payable)
   * Sales Revenue is derived per invoice line from each item's Income Account.
   * Explicit body values take precedence (customer/tax only).
   */
  static async _resolveAndSetAccounts(tenantId, id, invoice, body, t) {
    const { Customer, SystemConfig } = require('../models');
    const resolved = {};

    // Customer A/R from customer profile
    if (!invoice.customerAccountId) {
      const customer = invoice.customer || (await Customer.findOne({ where: { id: invoice.customerId, tenantId }, transaction: t }));
      if (customer && customer.arAccountId) resolved.customerAccountId = customer.arAccountId;
    }

    // VAT Payable from System Config (only when tax exists)
    if (!invoice.taxAccountId && parseFloat(invoice.taxTotal) > 0) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'vat_payable' }, transaction: t });
      if (cfg && cfg.configValue) resolved.taxAccountId = cfg.configValue;
    }

    // Explicit overrides win (revenue is item-derived, not overridable at header level)
    if (body.customerAccountId) resolved.customerAccountId = body.customerAccountId;
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

    // Revenue accounts are derived per line from each item's Income Account,
    // falling back to the company's default revenue account.
    const revenueMap = new Map();
    const missingIncomeAccountItems = [];
    for (const detail of invoice.details || []) {
      const item = detail.item;
      if (!item) continue;
      const lineAmount = parseFloat(detail.quantity || 0) * parseFloat(detail.unitPrice || 0);
      const discountAmount = lineAmount * parseFloat(detail.discountPercent || 0) / 100;
      const netAmount = lineAmount - discountAmount;
      if (netAmount <= 0) continue;
      const incomeAccountId = await SalesInvoiceService._resolveIncomeAccountId(tenantId, item);
      if (!incomeAccountId) {
        missingIncomeAccountItems.push(item.name || item.id);
        continue;
      }
      revenueMap.set(incomeAccountId, (revenueMap.get(incomeAccountId) || 0) + netAmount);
    }

    let taxAccountId = invoice.taxAccountId;
    if (!taxAccountId && parseFloat(invoice.taxTotal) > 0) {
      const cfg = await SystemConfig.findOne({ where: { tenantId, category: 'accounting', configKey: 'vat_payable' } });
      if (cfg && cfg.configValue) taxAccountId = cfg.configValue;
    }

    const ids = [customerAccountId, taxAccountId, ...revenueMap.keys()].filter(Boolean);

    // Inventory lines: DR Expense (COGS) / CR Inventory (Stock)
    const { InventoryBalance } = require('../models');
    const cogsMap = new Map();
    const inventoryMap = new Map();
    let hasStockItems = false;
    const missingExpenseAccountItems = [];
    const missingInventoryAccountItems = [];
    const unpricedStockItems = [];
    const insufficientStockItems = [];
    const lineDiagnostics = [];
    for (const detail of invoice.details || []) {
      const item = detail.item;
      const quantity = parseFloat(detail.quantity) || 0;
      const variantId = detail.variantId || null;
      const itemName = item ? (item.name || item.id) : null;
      const isStock = !!item && item.itemType === 'product' && item.isInventoryTracked !== false;

      lineDiagnostics.push({
        itemId: detail.itemId || null,
        name: itemName,
        itemType: item ? item.itemType : null,
        isInventoryTracked: item ? (item.isInventoryTracked !== false) : null,
        quantity,
        isStockItem: isStock,
        hasExpenseAccount: !!(item && item.expenseAccountId),
        hasInventoryAccount: !!(item && item.inventoryAccountId),
        warehouseId: invoice.warehouseId || null,
      });

      if (!isStock) continue;
      hasStockItems = true;
      if (quantity <= 0) continue;

      // Available quantity + FIFO cost from the cost layers (read-only).
      // Falls back to the legacy balance when no layers exist yet.
      let available = null;
      let avgCost = 0;
      if (invoice.warehouseId) {
        const peek = await FifoCostService.peekFifoCost(
          tenantId, detail.itemId, invoice.warehouseId, variantId, quantity
        );
        if (peek.hasLayers) {
          available = peek.available;
          avgCost = quantity > 0 ? peek.cost / quantity : 0;
        } else {
          const balance = await InventoryBalance.findOne({
            where: { tenantId, itemId: detail.itemId, warehouseId: invoice.warehouseId, variantId },
          });
          available = balance ? parseFloat(balance.quantityOnHand) || 0 : 0;
          avgCost = await SalesInvoiceService._resolveUnitCost(
            tenantId, detail, item, invoice.warehouseId, variantId
          );
        }
      } else {
        avgCost = await SalesInvoiceService._resolveUnitCost(
          tenantId, detail, item, null, variantId
        );
      }
      if (available !== null && available < quantity) {
        insufficientStockItems.push({ item: itemName, available, requested: quantity });
      }

      const cost = quantity * avgCost;
      if (cost <= 0) {
        unpricedStockItems.push(itemName);
      }

      if (!item.expenseAccountId) {
        missingExpenseAccountItems.push(itemName);
      } else if (cost > 0) {
        cogsMap.set(item.expenseAccountId, (cogsMap.get(item.expenseAccountId) || 0) + cost);
        if (!ids.includes(item.expenseAccountId)) ids.push(item.expenseAccountId);
      }

      if (!item.inventoryAccountId) {
        missingInventoryAccountItems.push(itemName);
      } else if (cost > 0) {
        inventoryMap.set(item.inventoryAccountId, (inventoryMap.get(item.inventoryAccountId) || 0) + cost);
        if (!ids.includes(item.inventoryAccountId)) ids.push(item.inventoryAccountId);
      }
    }

    const accounts = await Account.findAll({ where: { id: { [Op.in]: ids }, tenantId } });
    const byId = {};
    accounts.forEach((a) => { byId[a.id] = a; });
    const fmt = (aid) => (byId[aid] ? { id: byId[aid].id, code: byId[aid].code, name: byId[aid].name, type: byId[aid].type } : null);

    const revenueAccounts = [];
    for (const [accountId, amount] of revenueMap) {
      revenueAccounts.push({ account: fmt(accountId), amount: parseFloat(amount.toFixed(2)) });
    }

    const customerAcct = fmt(customerAccountId);
    const taxAcct = fmt(taxAccountId);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      grandTotal: parseFloat(invoice.grandTotal),
      subTotal: parseFloat(invoice.subTotal),
      taxTotal: parseFloat(invoice.taxTotal),
      discountTotal: parseFloat(invoice.discountTotal),
      customer: invoice.customer ? { id: invoice.customer.id, name: invoice.customer.name } : null,
      customerAccount: customerAcct ? { ...customerAcct, amount: parseFloat(invoice.grandTotal) || 0 } : null,
      revenueAccounts,
      taxAccount: taxAcct ? { ...taxAcct, amount: parseFloat(invoice.taxTotal) || 0 } : null,
      cogsAccounts: [...cogsMap].map(([accountId, amount]) => ({ account: fmt(accountId), amount: parseFloat(amount.toFixed(2)) })),
      inventoryAccounts: [...inventoryMap].map(([accountId, amount]) => ({ account: fmt(accountId), amount: parseFloat(amount.toFixed(2)) })),
      hasStockItems,
      missingIncomeAccountItems,
      missingExpenseAccountItems,
      missingInventoryAccountItems,
      unpricedStockItems,
      insufficientStockItems,
      lineDiagnostics,
    };
  }

  /**
   * Resolve the per-unit cost for an inventory-tracked invoice line.
   *
   * Precedence (most authoritative first):
   *   1. Weighted-average cost from the inventory balance (when maintained)
   *   2. Cost saved on the invoice line
   *   3. Cost from the item master
   *   4. Most recent stock-inward transaction cost (self-healing fallback for
   *      legacy data where average_cost was never maintained)
   */
  static async _resolveUnitCost(tenantId, detail, item, warehouseId, variantId = null, transaction = null) {
    const { InventoryBalance, InventoryTransaction } = require('../models');

    if (warehouseId) {
      const balance = await InventoryBalance.findOne({
        where: { tenantId, itemId: detail.itemId, warehouseId, variantId },
        transaction,
      });
      const balanceAvg = balance ? parseFloat(balance.averageCost) || 0 : 0;
      if (balanceAvg > 0) return balanceAvg;
    }

    const lineCost = parseFloat(detail.costPrice) || 0;
    if (lineCost > 0) return lineCost;

    const itemCost = item ? parseFloat(item.costPrice) || 0 : 0;
    if (itemCost > 0) return itemCost;

    if (warehouseId) {
      const lastIn = await InventoryTransaction.findOne({
        where: {
          tenantId,
          itemId: detail.itemId,
          warehouseId,
          variantId,
          quantityIn: { [Op.gt]: 0 },
        },
        order: [['transactionDate', 'DESC'], ['id', 'DESC']],
        transaction,
      });
      const lastInCost = lastIn ? parseFloat(lastIn.unitCost) || 0 : 0;
      if (lastInCost > 0) return lastInCost;
    }

    return 0;
  }

  /**
   * Resolve the income (sales revenue) account for an invoice line.
   *
   * Precedence: item's Income Account, then the company's default revenue
   * account from System Config (accounting → revenue_account).
   */
  static async _resolveIncomeAccountId(tenantId, item, transaction = null) {
    if (item && item.incomeAccountId) return item.incomeAccountId;
    const { SystemConfig } = require('../models');
    const cfg = await SystemConfig.findOne({
      where: { tenantId, category: 'accounting', configKey: 'revenue_account' },
      transaction,
    });
    return cfg && cfg.configValue ? cfg.configValue : null;
  }

  /**
   * Validate that the invoice has proper accounts configured before posting
   */
  static async validatePostingAccounts(tenantId, invoice) {
    const { Account } = require('../models');
    const { BadRequestError } = require('../utils/appError');

    // Customer Account (AR) is required
    if (!invoice.customerAccountId) {
      throw new BadRequestError(
        'Customer Account (A/R) is not configured. Set the A/R account on the customer profile, or select the Customer Account on the invoice before posting.'
      );
    }
    const arAccount = await Account.findOne({
      where: { id: invoice.customerAccountId, tenantId, isActive: true },
    });
    if (!arAccount) {
      throw new BadRequestError('Customer Account is invalid, inactive, or belongs to a different tenant');
    }

    // Revenue is derived per invoice line from each item's Income Account (Chart of
    // Account), falling back to the company's default revenue account.
    const incomeAccountIds = new Set();
    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;
      const item = detail.item;
      const incomeAccountId = await SalesInvoiceService._resolveIncomeAccountId(tenantId, item);
      if (!incomeAccountId) {
        const itemName = item ? item.name : detail.itemId;
        throw new BadRequestError(`Income Account is not configured for item: ${itemName}. Configure the item's Income Account or the company's default revenue account before posting this invoice.`);
      }
      incomeAccountIds.add(incomeAccountId);
    }
    if (incomeAccountIds.size) {
      const incomeAccounts = await Account.findAll({
        where: { id: { [Op.in]: [...incomeAccountIds] }, tenantId, isActive: true },
      });
      const validIds = new Set(incomeAccounts.map((a) => a.id));
      for (const aid of incomeAccountIds) {
        if (!validIds.has(aid)) {
          throw new BadRequestError('One or more item Income Accounts are invalid, inactive, or belong to a different tenant.');
        }
      }
    }

    // Tax Account is required when tax exists
    if (parseFloat(invoice.taxTotal) > 0) {
      if (!invoice.taxAccountId) {
        throw new BadRequestError('Tax Account (VAT Payable) is required because invoice has tax amount');
      }
      const taxAccount = await Account.findOne({
        where: { id: invoice.taxAccountId, tenantId, isActive: true },
      });
      if (!taxAccount) {
        throw new BadRequestError('Tax Account is invalid, inactive, or belongs to a different tenant');
      }
    }

    // Inventory-tracked products must have both COGS (Expense) and Inventory Asset
    // accounts configured, otherwise the COGS/Inventory journal lines would be skipped.
    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;
      const item = detail.item;
      if (!item) continue;
      const isStockItem = item.itemType === 'product' && item.isInventoryTracked !== false;
      if (!isStockItem) continue;
      const quantity = parseFloat(detail.quantity) || 0;
      if (quantity <= 0) continue;
      if (!item.expenseAccountId) {
        throw new BadRequestError(`COGS Account (Expense) is not configured for item "${item.name}". Configure the item's COGS Account before posting this invoice.`);
      }
      if (!item.inventoryAccountId) {
        throw new BadRequestError(`Inventory Account (Asset) is not configured for item "${item.name}". Configure the item's Inventory Account before posting this invoice.`);
      }
    }

    // Inventory availability and costing: posting must not drive stock negative,
    // and the sold cost must be determinable so COGS/Inventory post correctly.
    // FIFO cost layers are authoritative when present; otherwise fall back to
    // the legacy balance-based check (pre-migration data).
    const { InventoryBalance, InventoryCostLayer } = require('../models');
    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;
      const item = detail.item;
      if (!item) continue;
      const isStockItem = item.itemType === 'product' && item.isInventoryTracked !== false;
      if (!isStockItem || !invoice.warehouseId) continue;
      const quantity = parseFloat(detail.quantity) || 0;
      if (quantity <= 0) continue;
      const variantId = detail.variantId || null;

      const layerCount = await InventoryCostLayer.count({
        where: { tenantId, itemId: detail.itemId, warehouseId: invoice.warehouseId, variantId },
      });

      if (layerCount > 0) {
        const available = await FifoCostService.getAvailableQuantity(
          tenantId, detail.itemId, invoice.warehouseId, variantId
        );
        if (available < quantity) {
          throw new BadRequestError(`Insufficient stock for "${item.name}". Available (FIFO): ${available}, requested: ${quantity}`);
        }
        const remainingValue = await InventoryCostLayer.sum('remainingValue', {
          where: { tenantId, itemId: detail.itemId, warehouseId: invoice.warehouseId, variantId, remainingQuantity: { [Op.gt]: 0 } },
        });
        if (!remainingValue || parseFloat(remainingValue) <= 0) {
          throw new BadRequestError(`Inventory cost could not be determined for item "${item.name}". Record the item cost or a stock-inward transaction before posting this invoice.`);
        }
        continue;
      }

      const balance = await InventoryBalance.findOne({
        where: { tenantId, itemId: detail.itemId, warehouseId: invoice.warehouseId, variantId },
      });
      const available = balance ? parseFloat(balance.quantityOnHand) || 0 : 0;
      if (available < quantity) {
        throw new BadRequestError(`Insufficient stock for "${item.name}". Available: ${available}, requested: ${quantity}`);
      }
      const unitCost = await SalesInvoiceService._resolveUnitCost(
        tenantId, detail, item, invoice.warehouseId, variantId
      );
      if (unitCost <= 0) {
        throw new BadRequestError(`Inventory cost could not be determined for item "${item.name}". Record the item cost or a stock-inward transaction before posting this invoice.`);
      }
    }
  }

  /**
   * Build journal entry lines for sales invoice
   *
   * DR Accounts Receivable (Customer Account) - Grand Total
   * CR Sales Revenue (per item Income Account, grouped by Chart of Account) - net of discounts
   * CR VAT Payable (Tax Account) - Tax Total
   *
   * If Inventory Impact is enabled, additional lines are generated:
   * DR Cost of Goods Sold (Item expenseAccountId)
   * CR Inventory Asset (Item inventoryAccountId)
   */
  static async buildJournalLines(tenantId, invoice, allocationsByDetail = null) {
    const lines = [];

    // 1. DR Accounts Receivable - grandTotal
    lines.push({
      accountId: invoice.customerAccountId,
      debit: parseFloat(invoice.grandTotal),
      credit: 0,
      description: `Sales Invoice #${invoice.invoiceNumber}`,
    });

    // 2. CR Sales Revenue per item Income Account (grouped by Chart of Account),
    //    falling back to the company's default revenue account.
    const revenueMap = new Map();
    for (const detail of invoice.details || []) {
      const item = detail.item;
      if (!item) continue;
      const lineAmount = parseFloat(detail.quantity || 0) * parseFloat(detail.unitPrice || 0);
      const discountAmount = lineAmount * parseFloat(detail.discountPercent || 0) / 100;
      const netAmount = lineAmount - discountAmount;
      if (netAmount <= 0) continue;
      const incomeAccountId = await SalesInvoiceService._resolveIncomeAccountId(tenantId, item);
      if (!incomeAccountId) continue;
      revenueMap.set(incomeAccountId, (revenueMap.get(incomeAccountId) || 0) + netAmount);
    }
    for (const [accountId, amount] of revenueMap) {
      if (amount === 0) continue;
      lines.push({
        accountId,
        debit: 0,
        credit: parseFloat(amount.toFixed(2)),
        description: `Sales Invoice #${invoice.invoiceNumber}`,
      });
    }

    // 3. CR VAT Payable - taxTotal
    if (parseFloat(invoice.taxTotal) > 0 && invoice.taxAccountId) {
      lines.push({
        accountId: invoice.taxAccountId,
        debit: 0,
        credit: parseFloat(invoice.taxTotal),
        description: `VAT on Sales Invoice #${invoice.invoiceNumber}`,
      });
    }

    // 4. Inventory impact: DR Cost of Goods Sold / CR Inventory Asset per
    //    inventory-tracked product line (always posted for stock items).
    //    Stock is credited, expense (COGS) is debited.
    //    When FIFO allocations are provided they are the authoritative cost;
    //    otherwise fall back to unit-cost resolution (legacy / preview).
    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;
      const item = detail.item;
      if (!item) continue;
      const isStockItem = item.itemType === 'product' && item.isInventoryTracked !== false;
      if (!isStockItem) continue;
      if (!item.inventoryAccountId || !item.expenseAccountId) continue;

      const quantity = parseFloat(detail.quantity) || 0;
      if (quantity <= 0) continue;
      const variantId = detail.variantId || null;

      const allocations = allocationsByDetail ? allocationsByDetail.get(detail.id) : null;
      if (allocations && allocations.length) {
        const totalCost = FifoCostService.sumAllocationCost(allocations);
        if (totalCost <= 0) continue;
        lines.push({
          accountId: item.expenseAccountId,
          debit: parseFloat(totalCost.toFixed(2)),
          credit: 0,
          description: `COGS - ${item.name || ''} for Invoice #${invoice.invoiceNumber}`,
        });
        lines.push({
          accountId: item.inventoryAccountId,
          debit: 0,
          credit: parseFloat(totalCost.toFixed(2)),
          description: `Inventory (Stock) - ${item.name || ''} for Invoice #${invoice.invoiceNumber}`,
        });
        continue;
      }

      const avgCost = await SalesInvoiceService._resolveUnitCost(
        tenantId, detail, item, invoice.warehouseId || null, variantId
      );
      const totalCost = quantity * avgCost;
      if (totalCost <= 0) continue;

      lines.push({
        accountId: item.expenseAccountId,
        debit: parseFloat(totalCost.toFixed(2)),
        credit: 0,
        description: `COGS - ${item.name || ''} for Invoice #${invoice.invoiceNumber}`,
      });
      lines.push({
        accountId: item.inventoryAccountId,
        debit: 0,
        credit: parseFloat(totalCost.toFixed(2)),
        description: `Inventory (Stock) - ${item.name || ''} for Invoice #${invoice.invoiceNumber}`,
      });
    }

    return lines;
  }

  /**
   * Process inventory impact: reduce stock from warehouse using FIFO layers.
   *
   * Kept for backward compatibility — the posting flow now calls
   * FifoCostService.consumeInvoiceStock directly so the persisted allocations
   * can be reused for the journal entry. This wrapper performs the same FIFO
   * consumption when invoked independently.
   */
  static async processInventoryImpact(tenantId, invoice, userId, transaction) {
    return FifoCostService.consumeInvoiceStock(tenantId, invoice, transaction);
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

      // Analytical resource-income snapshot: mark cancelled (reporting only — NO accounting impact)
      if (existing.sellingResourceId) {
        const ResourceIncomeService = require('./ResourceIncomeService');
        await ResourceIncomeService.cancelForInvoice(existing, t);
      }

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
   * Reverse inventory impact (add stock back) for a cancelled/unposted invoice.
   *
   * Restores the original FIFO allocations to their source cost layers so the
   * reversal matches the posting exactly, and is idempotent — quantities
   * already restored (by a prior cancellation or sales return) are not
   * restored twice.
   */
  static async reverseInventoryImpact(tenantId, invoice, userId, transaction) {
    if (!invoice.warehouseId) return;

    for (const detail of invoice.details || []) {
      if (!detail.itemId) continue;

      const item = detail.item;
      if (!item) continue;
      if (item.itemType !== 'product' || item.isInventoryTracked === false) continue;

      const quantity = parseFloat(detail.quantity || 0);
      if (quantity <= 0) continue;

      const saleAllocations = await FifoCostService.getSaleAllocations(tenantId, detail.id, transaction);
      if (!saleAllocations.length) {
        // Legacy invoices posted before FIFO layers: fall back to reversing the
        // recorded sale transaction so we never corrupt stock silently.
        const { InventoryTransaction } = require('../models');
        const variantId = detail.variantId || null;
        const legacyScope = {
          tenantId, itemId: detail.itemId, variantId,
          warehouseId: invoice.warehouseId,
          referenceId: invoice.id,
          referenceLineId: detail.id,
        };

        // Idempotency: each recorded sale posting may only be reversed once.
        // If every sale transaction for this line already has a matching
        // cancellation return, skip instead of creating a duplicate reversal.
        const [saleCount, cancelCount] = await Promise.all([
          InventoryTransaction.count({
            where: { ...legacyScope, transactionType: 'sale', referenceType: 'SalesInvoice' },
            transaction,
          }),
          InventoryTransaction.count({
            where: { ...legacyScope, transactionType: 'return', referenceType: 'SalesInvoiceCancel' },
            transaction,
          }),
        ]);
        if (cancelCount >= saleCount) continue;

        const originalSale = await InventoryTransaction.findOne({
          where: {
            tenantId, itemId: detail.itemId, variantId,
            warehouseId: invoice.warehouseId,
            referenceId: invoice.id,
            transactionType: 'sale', referenceType: 'SalesInvoice',
          },
          order: [['transactionDate', 'DESC'], ['id', 'DESC']],
          transaction,
        });
        let unitCost = originalSale ? parseFloat(originalSale.unitCost) || 0 : 0;
        if (unitCost <= 0) {
          unitCost = await SalesInvoiceService._resolveUnitCost(
            tenantId, detail, item, invoice.warehouseId, variantId, transaction
          );
        }
        await InventoryTransactionService.recordTransaction({
          tenantId,
          itemId: detail.itemId,
          variantId,
          warehouseId: invoice.warehouseId,
          transactionType: 'return',
          referenceId: invoice.id,
          referenceType: 'SalesInvoiceCancel',
          referenceNumber: invoice.invoiceNumber,
          referenceLineId: detail.id,
          quantity,
          unitCost,
          totalCost: quantity * unitCost,
        }, transaction);
        continue;
      }

      // FIFO path — restore the original allocations oldest-first.
      await FifoCostService.restoreAllocations(tenantId, saleAllocations, quantity, {
        allocationType: 'cancel',
        referenceType: 'SalesInvoiceCancel',
        referenceId: invoice.id,
        referenceNumber: invoice.invoiceNumber,
        referenceLineId: detail.id,
        itemId: detail.itemId,
        variantId: detail.variantId || null,
        warehouseId: invoice.warehouseId,
        salesInvoiceId: invoice.id,
        salesInvoiceDetailId: detail.id,
      }, transaction);
    }
  }

  /**
   * Generate invoice number: SINV-YYYY-NNNNN
   * Continues from the highest existing number (SINV or legacy INV) for the year.
   */
  static async generateInvoiceNumber(tenantId) {
    const { SalesInvoice } = require('../models');
    const year = new Date().getFullYear();
    const lastInvoice = await SalesInvoice.findOne({
      where: {
        tenantId,
        [Op.or]: [
          { invoiceNumber: { [Op.like]: `SINV-${year}-%` } },
          { invoiceNumber: { [Op.like]: `INV-${year}-%` } },
        ],
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

    return `SINV-${year}-${String(nextNumber).padStart(5, '0')}`;
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