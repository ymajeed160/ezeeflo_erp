'use strict';
const { sequelize } = require('../models');
const CreditNoteRepository = require('../repositories/CreditNoteRepository');
const CreditNoteDTO = require('../dto/CreditNoteDTO');
const AuditService = require('./AuditService');
const { Op } = require('sequelize');

class CreditNoteService {
  /**
   * List credit notes with pagination, filtering, sorting, searching
   */
  static async list(tenantId, query = {}) {
    const { data, count, page, limit, totalPages } = await CreditNoteRepository.findAll(tenantId, query);
    return {
      data: data.map(CreditNoteDTO.toList),
      count,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get credit note by ID
   */
  static async getById(tenantId, id) {
    const creditNote = await CreditNoteRepository.findById(tenantId, id);
    if (!creditNote) {
      const error = new Error('Credit Note not found');
      error.status = 404;
      throw error;
    }
    return CreditNoteDTO.toDetail(creditNote);
  }

  /**
   * Create credit note with details, generate credit note number
   */
  static async create(tenantId, body, userId) {
    const t = await sequelize.transaction();
    try {
      // Generate credit note number if not provided
      if (!body.creditNoteNumber) {
        body.creditNoteNumber = await CreditNoteService.generateCreditNoteNumber(tenantId);
      }

      const data = CreditNoteDTO.toCreate(body, tenantId, userId);
      const creditNote = await CreditNoteRepository.create(data, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'CREATE',
        entity: 'CreditNote',
        entityId: creditNote.id,
        newValues: { creditNoteNumber: creditNote.creditNoteNumber, grandTotal: creditNote.grandTotal },
      }, t);

      await t.commit();
      return CreditNoteDTO.toDetail(creditNote);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Update credit note (only draft credit notes can be updated)
   */
  static async update(tenantId, id, body, userId) {
    const existing = await CreditNoteRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Credit Note not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft credit notes can be updated');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      const data = CreditNoteDTO.toUpdate(body, userId);
      const updated = await CreditNoteRepository.update(tenantId, id, data, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'UPDATE',
        entity: 'CreditNote',
        entityId: id,
        oldValues: { grandTotal: existing.grandTotal },
        newValues: { grandTotal: updated.grandTotal },
      }, t);

      await t.commit();
      return CreditNoteDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Delete credit note (only draft)
   */
  static async delete(tenantId, id) {
    const existing = await CreditNoteRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Credit Note not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft credit notes can be deleted');
      error.status = 400;
      throw error;
    }
    const t = await sequelize.transaction();
    try {
      await CreditNoteRepository.delete(tenantId, id, t);
      await t.commit();
      return { message: 'Credit Note deleted successfully' };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Post credit note: Create journal entry + inventory impact
   */
  static async post(tenantId, id, userId) {
    const existing = await CreditNoteRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Credit Note not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft credit notes can be posted');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      // 1. Create Journal Entry (reverse of sales invoice / credit customer AR)
      const JournalEntryService = require('./JournalEntryService');
      const journalLines = await CreditNoteService.buildJournalLines(tenantId, existing);

      const journalEntry = await JournalEntryService.createEntry({
        tenantId,
        entryDate: existing.creditNoteDate,
        reference: `CN-${existing.creditNoteNumber}`,
        description: `Credit Note #${existing.creditNoteNumber} - Customer: ${existing.customer ? existing.customer.customerName : ''}`,
        lines: journalLines,
      }, tenantId, userId, t);

      // Link journal entry to credit note
      await CreditNoteRepository.setJournalEntry(tenantId, id, journalEntry.id, t);

      // 2. Inventory Impact (if configured) - add stock back to warehouse
      if (existing.isInventoryImpact) {
        await CreditNoteService.processInventoryImpact(tenantId, existing, userId, t);
      }

      // 3. Update status to posted
      await CreditNoteRepository.updateStatus(tenantId, id, 'posted', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'POST',
        entity: 'CreditNote',
        entityId: id,
        newValues: { status: 'posted', journalEntryId: journalEntry.id },
      }, t);

      await t.commit();

      const updated = await CreditNoteRepository.findById(tenantId, id);
      return CreditNoteDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Cancel credit note
   */
  static async cancel(tenantId, id, userId) {
    const existing = await CreditNoteRepository.findById(tenantId, id);
    if (!existing) {
      const error = new Error('Credit Note not found');
      error.status = 404;
      throw error;
    }
    if (existing.status !== 'draft') {
      const error = new Error('Only draft credit notes can be cancelled');
      error.status = 400;
      throw error;
    }

    const t = await sequelize.transaction();
    try {
      await CreditNoteRepository.updateStatus(tenantId, id, 'cancelled', userId, t);

      await AuditService.log({
        tenantId,
        userId,
        action: 'CANCEL',
        entity: 'CreditNote',
        entityId: id,
        newValues: { status: 'cancelled' },
      }, t);

      await t.commit();

      const updated = await CreditNoteRepository.findById(tenantId, id);
      return CreditNoteDTO.toDetail(updated);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Build journal entry lines for credit note (credit AR, debit revenue & VAT)
   *
   * CR Accounts Receivable (Customer AR Account) - Grand Total (reduce customer receivable)
   * DR Sales Revenue (Item income account) - Sub Total (net of discounts) (reduce recognized revenue)
   * DR VAT Payable - Tax Total (reduce VAT liability)
   */
  static async buildJournalLines(tenantId, creditNote) {
    const { Account } = require('../models');
    const lines = [];

    // Find customer AR account
    const customer = creditNote.customer;
    const arAccountId = customer ? customer.arAccountId : null;
    if (!arAccountId) {
      throw new Error('Customer does not have an Accounts Receivable account configured');
    }

    // 1. CR Accounts Receivable - grandTotal (reduce customer receivable)
    lines.push({
      accountId: arAccountId,
      debit: 0,
      credit: parseFloat(creditNote.grandTotal),
      description: `Credit Note #${creditNote.creditNoteNumber}`,
    });

    // Group lines by item income account
    const accountMap = new Map();
    for (const detail of creditNote.details || []) {
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

    // 2. DR Sales Revenue per income account (reduce revenue)
    for (const [accountId, amount] of accountMap) {
      lines.push({
        accountId,
        debit: parseFloat(amount.toFixed(2)),
        credit: 0,
        description: `Credit Note #${creditNote.creditNoteNumber}`,
      });
    }

    // 3. DR VAT Payable (reduce VAT liability)
    if (parseFloat(creditNote.taxTotal) > 0) {
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
          debit: parseFloat(creditNote.taxTotal),
          credit: 0,
          description: `VAT reversal on Credit Note #${creditNote.creditNoteNumber}`,
        });
      }
    }

    return lines;
  }

  /**
   * Process inventory impact: add stock back to warehouse
   */
  static async processInventoryImpact(tenantId, creditNote, userId, transaction) {
    const { InventoryTransaction, InventoryBalance } = require('../models');

    for (const detail of creditNote.details || []) {
      if (!detail.itemId) continue;

      const item = detail.item;
      if (!item || !item.inventoryAccountId) continue;

      const quantity = parseFloat(detail.quantity);
      const costPrice = parseFloat(detail.costPrice) || parseFloat(item.costPrice) || 0;

      // Increase inventory balance with weighted average recalc
      const balance = await InventoryBalance.findOne({
        where: { tenantId, itemId: detail.itemId, warehouseId: creditNote.warehouseId },
        transaction,
      });

      let newQty = quantity;
      let newValue = quantity * costPrice;

      if (balance) {
        const currentQty = parseFloat(balance.quantityOnHand) || 0;
        const currentValue = parseFloat(balance.inventoryValue) || (currentQty * costPrice);
        newQty = currentQty + quantity;
        newValue = currentValue + (quantity * costPrice);
        await balance.update(
          { quantityOnHand: newQty, inventoryValue: newValue, updatedAt: new Date() },
          { transaction }
        );
      }

      // The effective cost after restocking (weighted average)
      const effectiveCost = newQty > 0 ? (newValue / newQty) : costPrice;

      // Create inventory transaction record (IN - return)
      const totalCost = quantity * effectiveCost;
      await InventoryTransaction.create({
        tenantId,
        itemId: detail.itemId,
        warehouseId: creditNote.warehouseId,
        transactionType: 'credit_note',
        referenceId: creditNote.id,
        referenceType: 'CreditNote',
        referenceNumber: creditNote.creditNoteNumber,
        quantity: quantity, // positive = back in
        unitCost: effectiveCost,
        totalCost: totalCost,
        balanceAfter: newQty,
        createdAt: new Date(),
      }, { transaction });
    }
  }

  /**
   * Generate credit note number: CN-YYYY-NNNNN
   */
  static async generateCreditNoteNumber(tenantId) {
    const { CreditNote } = require('../models');
    const year = new Date().getFullYear();
    const lastCN = await CreditNote.findOne({
      where: {
        tenantId,
        creditNoteNumber: { [Op.like]: `CN-${year}-%` },
      },
      order: [['id', 'DESC']],
    });

    let nextNumber = 1;
    if (lastCN && lastCN.creditNoteNumber) {
      const parts = lastCN.creditNoteNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `CN-${year}-${String(nextNumber).padStart(5, '0')}`;
  }
}

module.exports = CreditNoteService;