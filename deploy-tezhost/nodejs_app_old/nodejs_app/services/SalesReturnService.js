'use strict';
const { sequelize } = require('../models');
const SalesReturnRepository = require('../repositories/SalesReturnRepository');
const SalesReturnDTO = require('../dto/SalesReturnDTO');
const AuditService = require('./AuditService');
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
   * Post sales return: Create journal entry with account selection dialog
   * Similar to approve but accepts account overrides from the post dialog
   */
  static async post(tenantId, id, userId, body = {}) {
    const existing = await SalesReturnRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Sales Return not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'approved') {
      const error = new Error('Only approved returns can be posted. Please approve the return first.');
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
        await SalesReturnRepository.update(tenantId, id, updateData, t);
        if (body.customerAccountId) existing.customerAccountId = body.customerAccountId;
        if (body.revenueAccountId) existing.revenueAccountId = body.revenueAccountId;
        if (body.taxAccountId) existing.taxAccountId = body.taxAccountId;
      }

      const salesReturn = existing;

      // Validate accounts before posting
      await SalesReturnService.validatePostingAccounts(tenantId, salesReturn);

      // 1. Create Journal Entry
      const JournalEntryService = require('./JournalEntryService');
      const journalLines = await SalesReturnService.buildPostJournalLines(tenantId, salesReturn);

      const journalEntry = await JournalEntryService.createEntry({
        tenantId,
        entryDate: salesReturn.returnDate,
        reference: `SR-${salesReturn.returnNumber}`,
        description: `Sales Return #${salesReturn.returnNumber} - Customer: ${salesReturn.customer ? salesReturn.customer.name : ''}`,
        lines: journalLines,
      }, tenantId, userId, t);

      // Link journal entry to return
      await SalesReturnRepository.setJournalEntry(tenantId, id, journalEntry.id, t);

      // 2. Inventory Impact (if configured) - add stock back
      if (salesReturn.isInventoryImpact) {
        await SalesReturnService.processInventoryImpact(tenantId, salesReturn, userId, t);
      }

      // 3. Update status to posted
      await SalesReturnRepository.updateStatus(tenantId, id, 'approved', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'POST',
        entity: 'SalesReturn',
        entityId: id,
        newValues: { status: 'approved', journalEntryId: journalEntry.id },
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
   * Build journal entry lines for sales return (reverse of sales invoice)
   * Uses explicit accounts on the return if available, otherwise falls back
   * to customer/item master data.
   *
   * DR Sales Return/Revenue Account - Sub Total (net of discounts)
   * DR Tax Account - Tax Total
   * CR Customer Account (A/R) - Grand Total
   */
  static async buildJournalLines(tenantId, salesReturn) {
    // If the return already has explicit accounts set, use the Post journal lines builder
    if (salesReturn.customerAccountId && salesReturn.revenueAccountId) {
      return SalesReturnService.buildPostJournalLines(tenantId, salesReturn);
    }

    const { Account } = require('../models');
    const lines = [];

    // Find customer AR account from customer master
    const customer = salesReturn.customer;
    const arAccountId = customer ? customer.arAccountId : null;
    if (!arAccountId) {
      throw new Error('Customer does not have an Accounts Receivable account configured. Please use the Post button to select accounts manually.');
    }

    // Group lines by item income account
    const accountMap = new Map();
    for (const detail of salesReturn.details || []) {
      const item = detail.item;
      const incomeAccountId = item ? item.incomeAccountId : null;
      if (!incomeAccountId) continue;

      const lineAmount = parseFloat(detail.quantity) * parseFloat(detail.unitPrice);
      const discountAmount = lineAmount * parseFloat(detail.discountPercent) / 100;
      const netAmount = lineAmount - discountAmount;

      if (!accountMap.has(incomeAccountId)) {
        accountMap.set(incomeAccountId, 0);
      }
      accountMap.set(incomeAccountId, accountMap.get(incomeAccountId) + netAmount);
    }

    // 1. DR Sales Revenue per income account (reverse revenue)
    for (const [accountId, amount] of accountMap) {
      lines.push({
        accountId,
        debit: parseFloat(amount.toFixed(2)),
        credit: 0,
        description: `Sales Return #${salesReturn.returnNumber}`,
      });
    }

    // 2. DR VAT Payable (reverse VAT)
    if (parseFloat(salesReturn.taxTotal) > 0) {
      const vatAccount = await Account.findOne({
        where: {
          tenantId,
          accountName: { [Op.like]: '%VAT Payable%' },
          accountType: 'liability',
        },
      });
      if (vatAccount) {
        lines.push({
          accountId: vatAccount.id,
          debit: parseFloat(salesReturn.taxTotal),
          credit: 0,
          description: `VAT reversal on Sales Return #${salesReturn.returnNumber}`,
        });
      }
    }

    // 3. CR Accounts Receivable - grandTotal
    lines.push({
      accountId: arAccountId,
      debit: 0,
      credit: parseFloat(salesReturn.grandTotal),
      description: `Sales Return #${salesReturn.returnNumber}`,
    });

    return lines;
  }

  /**
   * Process inventory impact: add stock back to warehouse
   */
  static async processInventoryImpact(tenantId, salesReturn, userId, transaction) {
    const { InventoryTransaction, InventoryBalance } = require('../models');

    for (const detail of salesReturn.details || []) {
      if (!detail.itemId) continue;

      const item = detail.item;
      if (!item || !item.inventoryAccountId) continue;

      const quantity = parseFloat(detail.quantity);
      const costPrice = parseFloat(item.costPrice) || 0;

      // Increase inventory balance
      const balance = await InventoryBalance.findOne({
        where: { tenantId, itemId: detail.itemId, warehouseId: salesReturn.warehouseId },
        transaction,
      });

      if (balance) {
        const newQty = parseFloat(balance.quantityOnHand) + quantity;
        await balance.update(
          { quantityOnHand: newQty, updatedAt: new Date() },
          { transaction }
        );
      }

      // Create inventory transaction record (IN - return)
      const totalCost = quantity * costPrice;
      await InventoryTransaction.create({
        tenantId,
        itemId: detail.itemId,
        warehouseId: salesReturn.warehouseId,
        transactionType: 'sales_return',
        referenceId: salesReturn.id,
        referenceType: 'SalesReturn',
        referenceNumber: salesReturn.returnNumber,
        quantity: quantity, // positive = back in
        unitCost: costPrice,
        totalCost: totalCost,
        balanceAfter: balance ? parseFloat(balance.quantityOnHand) + quantity : quantity,
        createdAt: new Date(),
      }, { transaction });
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