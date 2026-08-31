const db = require('../models');
const SupplierPaymentRepository = require('../repositories/SupplierPaymentRepository');
const SupplierPaymentDTO = require('../dto/SupplierPaymentDTO');
const JournalEntryService = require('./JournalEntryService');
const AuditService = require('./AuditService');
const { requireDeletionEnabled } = require('../utils/deletionSettings');

const SOURCE_TYPE = 'SUPPLIER_PAYMENT';
const REVERSAL_SOURCE_TYPE = 'SUPPLIER_PAYMENT_REVERSAL';

class SupplierPaymentService {
  async findAll(tenantId, options) {
    const result = await SupplierPaymentRepository.findAll(tenantId, options);
    result.rows = SupplierPaymentDTO.toDTOList(result.rows);
    return result;
  }

  async findById(tenantId, id) {
    const record = await SupplierPaymentRepository.findById(tenantId, id);
    if (!record) throw new Error('Supplier Payment not found');
    return SupplierPaymentDTO.toDTO(record);
  }

  async create(tenantId, userId, data) {
    if (!data.paymentNumber) {
      data.paymentNumber = await SupplierPaymentRepository.getNextPaymentNumber(tenantId);
    }

    const existing = await SupplierPaymentRepository.findByNumber(tenantId, data.paymentNumber);
    if (existing) throw new Error('Payment number already exists');

    // Validate supplier exists
    const supplier = await db.Supplier.findOne({ where: { id: data.supplierId, tenant_id: tenantId } });
    if (!supplier) throw new Error('Supplier not found');

    // Validate allocations total matches amount
    if (data.allocations && data.allocations.length > 0) {
      const totalAllocated = data.allocations.reduce((sum, a) => sum + parseFloat(a.allocatedAmount || 0), 0);
      if (Math.abs(totalAllocated - parseFloat(data.amount)) > 0.01) {
        throw new Error('Allocated amounts must equal payment amount');
      }
    }

    data.status = 'draft';
    data.createdBy = userId;

    const record = await SupplierPaymentRepository.create(tenantId, data);
    await AuditService.log(tenantId, userId, 'supplier_payments', record.id, 'created', data);

    return await this.findById(tenantId, record.id);
  }

  async update(tenantId, id, data) {
    const existing = await SupplierPaymentRepository.findById(tenantId, id);
    if (!existing) throw new Error('Supplier Payment not found');

    if (['posted', 'cancelled'].includes(existing.status)) {
      throw new Error('Cannot edit a posted or cancelled payment');
    }

    const record = await SupplierPaymentRepository.update(tenantId, id, data);
    await AuditService.log(tenantId, data.updatedBy || data.createdBy, 'supplier_payments', id, 'updated', data);
    return await this.findById(tenantId, record.id);
  }

  async delete(tenantId, id, userId, reason = null) {
    const existing = await SupplierPaymentRepository.findById(tenantId, id);
    if (!existing) throw new Error('Supplier Payment not found');
    await requireDeletionEnabled(tenantId, 'supplier_payments');
    if (existing.journalEntryId) {
      throw new Error('This Supplier Payment is linked to a journal entry. Delete the journal entry first, then delete this payment.');
    }

    const t = await db.sequelize.transaction();
    try {
      await db.SupplierPayment.update(
        { deletedBy: userId, deleteReason: reason || null },
        { where: { id, tenantId }, transaction: t }
      );
      await SupplierPaymentRepository.delete(tenantId, id, { transaction: t });
      await t.commit();
      return true;
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async restore(tenantId, id, userId) {
    const existing = await SupplierPaymentRepository.findById(tenantId, id, true);
    if (!existing) throw new Error('Supplier Payment not found');
    if (!existing.deletedAt) throw new Error('Supplier Payment is not deleted');

    await SupplierPaymentRepository.restore(tenantId, id, {});
    return await this.findById(tenantId, id);
  }

  async cancel(tenantId, id, userId, reason = null) {
    const existing = await SupplierPaymentRepository.findById(tenantId, id);
    if (!existing) throw new Error('Supplier Payment not found');
    if (existing.status === 'cancelled') throw new Error('Supplier Payment is already cancelled');

    if (existing.status === 'posted') {
      const result = await this.reverse(tenantId, userId, id);
      await db.SupplierPayment.update(
        { cancelReason: reason || null },
        { where: { id, tenantId } }
      );
      return result;
    }

    await SupplierPaymentRepository.update(tenantId, id, {
      status: 'cancelled',
      cancelReason: reason || null,
      updatedBy: userId,
    });
    return await this.findById(tenantId, id);
  }

  /**
   * Resolve the Chart of Accounts for a payment:
   * - Supplier account  → debit  (from Supplier.apAccountId)
   * - Credit account    → credit (bank COA for bank/cheque, cash COA for cash)
   * Never hardcodes account IDs — always reads existing relationships.
   */
  async _resolvePosting(record, tenantId, transaction = null) {
    const supplier = await db.Supplier.findOne({ where: { id: record.supplierId, tenantId }, transaction });
    if (!supplier) throw new Error('Supplier not found');
    if (!supplier.apAccountId) throw new Error('Supplier is not linked to a Chart of Account.');

    const apAccount = await db.Account.findOne({ where: { id: supplier.apAccountId, tenantId }, transaction });
    if (!apAccount) throw new Error('Supplier Chart of Account not found.');
    if (!apAccount.isActive) throw new Error('Supplier Chart of Account is inactive.');

    const method = String(record.paymentMethod || '').toLowerCase();
    let creditAccount = null;

    if (method === 'cash') {
      if (!record.cashAccountId) throw new Error('Please select a Cash Account.');
      creditAccount = await db.Account.findOne({ where: { id: record.cashAccountId, tenantId }, transaction });
      if (!creditAccount) throw new Error('Selected Cash Account not found.');
      if (creditAccount.type !== 'asset') throw new Error('Selected account is not configured as a Cash Account.');
    } else {
      // Bank Transfer, Cheque, or any other bank-based method
      if (!record.bankAccountId) throw new Error('Selected bank account is not linked to a Chart of Account.');
      creditAccount = await db.Account.findOne({ where: { id: record.bankAccountId, tenantId }, transaction });
      if (!creditAccount) throw new Error('Selected bank account Chart of Account not found.');
      if (creditAccount.type !== 'asset') throw new Error('Selected bank account Chart of Account is not an asset account.');
    }

    return { supplier, apAccount, creditAccount };
  }

  /**
   * Atomic posting: validate accounts → create Journal Entry → post it →
   * mark payment posted → audit. Either fully succeeds or fully rolls back.
   */
  async _executePosting(tenantId, userId, id, overrides = {}) {
    const transaction = await db.sequelize.transaction();
    try {
      const record = await SupplierPaymentRepository.findById(tenantId, id);
      if (!record) throw new Error('Supplier Payment not found');
      if (record.status === 'posted') throw new Error('This Supplier Payment has already been posted.');

      // Duplicate Journal Entry prevention
      const duplicate = await SupplierPaymentRepository.findJournalEntryBySource(tenantId, SOURCE_TYPE, id, transaction);
      if (duplicate) throw new Error('A Journal Entry already exists for this payment.');

      const resolved = await this._resolvePosting(record, tenantId, transaction);

      let apAccount = resolved.apAccount;
      let creditAccount = resolved.creditAccount;

      if (overrides.apAccountId) {
        apAccount = await db.Account.findOne({ where: { id: overrides.apAccountId, tenantId }, transaction });
        if (!apAccount) throw new Error('Accounts Payable account not found.');
      }
      if (overrides.creditAccountId) {
        creditAccount = await db.Account.findOne({ where: { id: overrides.creditAccountId, tenantId }, transaction });
        if (!creditAccount) throw new Error('Cash/Bank account not found.');
      }

      const amount = parseFloat(record.amount);
      const supplierName = resolved.supplier.name;

      // DR Supplier (Accounts Payable) / CR Bank or Cash
      const journalEntry = await JournalEntryService.createEntry({
        entryDate: record.paymentDate,
        reference: record.paymentNumber,
        description: `Supplier Payment - ${supplierName} (${record.paymentNumber})`,
        source: SOURCE_TYPE,
        sourceId: id,
        isAutoGenerated: true,
        lines: [
          { accountId: apAccount.id, debit: amount, credit: 0, description: `Payment to ${supplierName}` },
          { accountId: creditAccount.id, debit: 0, credit: amount, description: `Payment via ${record.paymentMethod}` },
        ],
      }, tenantId, userId, transaction);

      await JournalEntryService.postEntry(journalEntry.id, tenantId, userId, transaction);

      await SupplierPaymentRepository.update(tenantId, id, {
        status: 'posted',
        journalEntryId: journalEntry.id,
        approvedBy: userId,
        approvedAt: new Date(),
      }, transaction);

      await AuditService.log(tenantId, userId, 'supplier_payments', id, 'posted', {
        status: 'posted',
        journalEntryId: journalEntry.id,
        paymentMethod: record.paymentMethod,
        amount,
        supplierId: record.supplierId,
        bankAccountId: record.bankAccountId || null,
        cashAccountId: record.cashAccountId || null,
      });

      await transaction.commit();
      return await this.findById(tenantId, id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Confirm a draft payment → automatically creates and posts the Journal Entry.
   */
  async confirm(tenantId, userId, id) {
    const record = await SupplierPaymentRepository.findById(tenantId, id);
    if (!record) throw new Error('Supplier Payment not found');
    if (record.status !== 'draft') throw new Error('Only Draft payments can be confirmed');

    return await this._executePosting(tenantId, userId, id);
  }

  /**
   * Legacy path for payments already in 'confirmed' status.
   * Accepts optional account overrides from the caller.
   */
  async postToJournal(tenantId, userId, id, accountData = {}) {
    const record = await SupplierPaymentRepository.findById(tenantId, id);
    if (!record) throw new Error('Supplier Payment not found');
    if (record.status !== 'confirmed') throw new Error('Only Confirmed payments can be posted to journal');

    const overrides = {};
    if (accountData.apAccountId) overrides.apAccountId = accountData.apAccountId;
    if (accountData.cashAccountId) overrides.creditAccountId = accountData.cashAccountId;
    if (accountData.creditAccountId) overrides.creditAccountId = accountData.creditAccountId;

    return await this._executePosting(tenantId, userId, id, overrides);
  }

  /**
   * Preview the Chart of Accounts that would be used when posting this payment.
   */
  async getPostingPreview(tenantId, id) {
    const record = await SupplierPaymentRepository.findById(tenantId, id);
    if (!record) throw new Error('Supplier Payment not found');

    const { supplier, apAccount, creditAccount } = await this._resolvePosting(record, tenantId);

    return {
      id: record.id,
      paymentNumber: record.paymentNumber,
      paymentDate: record.paymentDate,
      amount: parseFloat(record.amount),
      paymentMethod: record.paymentMethod,
      supplier: {
        id: supplier.id,
        name: supplier.name,
        account: { id: apAccount.id, code: apAccount.code, name: apAccount.name, type: apAccount.type },
      },
      creditAccount: { id: creditAccount.id, code: creditAccount.code, name: creditAccount.name, type: creditAccount.type },
      lines: [
        { side: 'DEBIT', account: { code: apAccount.code, name: apAccount.name }, amount: parseFloat(record.amount) },
        { side: 'CREDIT', account: { code: creditAccount.code, name: creditAccount.name }, amount: parseFloat(record.amount) },
      ],
    };
  }

  /**
   * Reverse a posted payment: creates a reversal Journal Entry,
   * restores invoice outstanding balances, and keeps audit history.
   */
  async reverse(tenantId, userId, id) {
    const record = await SupplierPaymentRepository.findById(tenantId, id);
    if (!record) throw new Error('Supplier Payment not found');
    if (record.status !== 'posted') throw new Error('Only posted payments can be reversed');
    if (!record.journalEntryId) throw new Error('Payment has no Journal Entry to reverse.');

    const transaction = await db.sequelize.transaction();
    try {
      const duplicate = await SupplierPaymentRepository.findJournalEntryBySource(tenantId, REVERSAL_SOURCE_TYPE, id, transaction);
      if (duplicate) throw new Error('A reversal Journal Entry already exists for this payment.');

      const resolved = await this._resolvePosting(record, tenantId, transaction);
      const amount = parseFloat(record.amount);

      // Original: DR Supplier AP / CR Bank/Cash → Reversal: DR Bank/Cash / CR Supplier AP
      const reversal = await JournalEntryService.createEntry({
        entryDate: new Date().toISOString().split('T')[0],
        reference: `REV-${record.paymentNumber}`,
        description: `Reversal of Supplier Payment - ${resolved.supplier.name} (${record.paymentNumber})`,
        source: REVERSAL_SOURCE_TYPE,
        sourceId: id,
        isAutoGenerated: true,
        lines: [
          { accountId: resolved.creditAccount.id, debit: amount, credit: 0, description: `Reversal of payment to ${resolved.supplier.name}` },
          { accountId: resolved.apAccount.id, debit: 0, credit: amount, description: `Reversal of payment to ${resolved.supplier.name}` },
        ],
      }, tenantId, userId, transaction);

      await JournalEntryService.postEntry(reversal.id, tenantId, userId, transaction);

      // Restore invoice outstanding balances by removing this payment's allocations
      const allocations = await db.SupplierPaymentAllocation.findAll({
        where: { supplierPaymentId: id, tenantId },
        transaction,
      });
      const invoiceIds = allocations.map((a) => a.purchaseInvoiceId);
      await db.SupplierPaymentAllocation.destroy({ where: { supplierPaymentId: id, tenantId }, transaction });
      await SupplierPaymentRepository._updateInvoiceStatuses(tenantId, invoiceIds, transaction);

      await SupplierPaymentRepository.update(tenantId, id, {
        status: 'cancelled',
        updatedBy: userId,
      }, transaction);

      await AuditService.log(tenantId, userId, 'supplier_payments', id, 'reversed', {
        status: 'cancelled',
        reversalJournalEntryId: reversal.id,
      });

      await transaction.commit();
      return await this.findById(tenantId, id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new SupplierPaymentService();