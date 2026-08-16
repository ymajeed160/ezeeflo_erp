const bankTransactionRepository = require('../repositories/BankTransactionRepository');
const bankAccountRepository = require('../repositories/BankAccountRepository');
const { BankAccount, Account, JournalEntry, sequelize } = require('../models');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');
const journalEntryService = require('./JournalEntryService');

const TRANSACTION_TYPES_INFLOW = [
  'Deposit', 'Transfer In', 'Interest Income', 'Cheque Deposit',
  'Direct Credit', 'Opening Balance',
];

const TRANSACTION_TYPES_OUTFLOW = [
  'Withdrawal', 'Transfer Out', 'Bank Charge', 'Interest Expense',
  'Cheque Payment', 'Direct Debit', 'Adjustment',
];

class BankTransactionService {
  async getTransactions(tenantId, query = {}) {
    const { page = 1, limit = 20, search, bankAccountId, startDate, endDate, status, transactionType, isReconciled } = query;
    return await bankTransactionRepository.findAndCountAll(tenantId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      bankAccountId,
      startDate,
      endDate,
      status,
      transactionType,
      isReconciled,
    });
  }

  async getTransactionById(id, tenantId) {
    const txn = await bankTransactionRepository.findById(id, tenantId);
    if (!txn) throw new NotFoundError('Bank transaction not found');
    return txn;
  }

  async createTransaction(data, tenantId, userId) {
    // Validate bank account
    const bankAccount = await bankAccountRepository.findById(data.bankAccountId, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');
    if (!bankAccount.isActive) throw new BadRequestError('Bank account is inactive');

    const amount = parseFloat(data.amount);
    const direction = data.direction || (TRANSACTION_TYPES_INFLOW.includes(data.transactionType) ? 'In' : 'Out');

    // Validate offset account for manual transactions
    if (!data.sourceType && !data.offsetAccountId) {
      throw new BadRequestError('Offset account is required for manual transactions');
    }

    // Validate offset account if provided
    if (data.offsetAccountId) {
      const offsetAcc = await Account.findOne({ where: { id: data.offsetAccountId, tenantId } });
      if (!offsetAcc) throw new BadRequestError('Offset account not found for this tenant');
    }

    // Generate transaction number
    const transactionNumber = await bankTransactionRepository.generateTransactionNumber(tenantId);

    // Get current running balance
    const currentBalance = await bankTransactionRepository.getRunningBalance(data.bankAccountId, tenantId);
    const newBalance = direction === 'In' ? currentBalance + amount : currentBalance - amount;

    const txnData = {
      bankAccountId: data.bankAccountId,
      transactionNumber,
      transactionDate: data.transactionDate,
      valueDate: data.valueDate || data.transactionDate,
      transactionType: data.transactionType,
      direction,
      referenceNumber: data.referenceNumber || null,
      externalReference: data.externalReference || null,
      description: data.description || null,
      debitAmount: direction === 'Out' ? amount : 0,
      creditAmount: direction === 'In' ? amount : 0,
      runningBalance: newBalance,
      status: 'Draft',
      offsetAccountId: data.offsetAccountId || null,
      sourceType: data.sourceType || null,
      sourceId: data.sourceId || null,
      notes: data.notes || null,
    };

    const txn = await bankTransactionRepository.create(txnData, tenantId, userId);
    logger.info(`Bank transaction ${transactionNumber} created by user ${userId} in tenant ${tenantId}`);
    return await bankTransactionRepository.findById(txn.id, tenantId);
  }

  async updateTransaction(id, data, tenantId, userId) {
    const txn = await bankTransactionRepository.findById(id, tenantId);
    if (!txn) throw new NotFoundError('Bank transaction not found');
    if (txn.status !== 'Draft') throw new BadRequestError('Only draft transactions can be edited');

    const updateData = {};
    if (data.transactionDate !== undefined) updateData.transactionDate = data.transactionDate;
    if (data.valueDate !== undefined) updateData.valueDate = data.valueDate;
    if (data.transactionType !== undefined) updateData.transactionType = data.transactionType;
    if (data.direction !== undefined) updateData.direction = data.direction;
    if (data.referenceNumber !== undefined) updateData.referenceNumber = data.referenceNumber;
    if (data.externalReference !== undefined) updateData.externalReference = data.externalReference;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.offsetAccountId !== undefined) updateData.offsetAccountId = data.offsetAccountId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // If amount changes, recalculate running balance
    if (data.amount !== undefined) {
      const amount = parseFloat(data.amount);
      const direction = data.direction || txn.direction;
      const currentBalance = await bankTransactionRepository.getRunningBalance(txn.bankAccountId, tenantId);
      updateData.debitAmount = direction === 'Out' ? amount : 0;
      updateData.creditAmount = direction === 'In' ? amount : 0;
      updateData.runningBalance = direction === 'In' ? currentBalance + amount : currentBalance - amount;
    }

    const updated = await bankTransactionRepository.update(id, updateData, tenantId, userId);
    if (!updated) throw new NotFoundError('Bank transaction not found after update');
    return await bankTransactionRepository.findById(id, tenantId);
  }

  async postTransaction(id, tenantId, userId) {
    const txn = await bankTransactionRepository.findById(id, tenantId);
    if (!txn) throw new NotFoundError('Bank transaction not found');
    if (txn.status !== 'Draft') throw new BadRequestError(`Cannot post transaction with status "${txn.status}"`);

    return await sequelize.transaction(async (transaction) => {
      // Create journal entry
      const bankAccount = await BankAccount.findOne({
        where: { id: txn.bankAccountId, tenantId },
        include: [{ model: Account, as: 'chartOfAccount' }],
        transaction,
      });

      if (!bankAccount || !bankAccount.chartOfAccount) {
        throw new BadRequestError('Bank account chart of account not configured');
      }

      let offsetAccountId = txn.offsetAccountId;

      // For bank charges without specific offset, use the bank charge account from settings
      if (txn.transactionType === 'Bank Charge' && !offsetAccountId) {
        throw new BadRequestError('Offset account is required for bank charge transactions');
      }

      const bankCoaId = bankAccount.chartOfAccount.id;
      const amount = txn.direction === 'In' ? parseFloat(txn.creditAmount) : parseFloat(txn.debitAmount);

      let lines;
      if (txn.direction === 'In') {
        // Money received: Bank DR, Offset CR
        lines = [
          { accountId: bankCoaId, debit: amount, credit: 0 },
          { accountId: offsetAccountId, debit: 0, credit: amount },
        ];
      } else {
        // Money paid: Offset DR, Bank CR
        lines = [
          { accountId: offsetAccountId, debit: amount, credit: 0 },
          { accountId: bankCoaId, debit: 0, credit: amount },
        ];
      }

      const journalData = {
        lines,
        entryDate: txn.transactionDate,
        reference: txn.transactionNumber,
        description: txn.description || `${txn.transactionType} - ${txn.transactionNumber}`,
      };

      const journalEntry = await journalEntryService.createEntry(journalData, tenantId, userId, transaction);

      // Post the journal entry (within the same transaction) so it appears in General Ledger
      const { JournalEntry: JournalEntryModel } = require('../models');
      await JournalEntryModel.update(
        { status: 'posted', postedAt: new Date(), postedBy: userId, updatedBy: userId },
        { where: { id: journalEntry.id, tenantId }, transaction }
      );

      // Update transaction status (within the same transaction)
      await bankTransactionRepository.update(id, {
        status: 'Posted',
        journalEntryId: journalEntry.id,
      }, tenantId, userId, { transaction });

      logger.info(`Bank transaction ${txn.transactionNumber} posted by user ${userId}`);
      return await bankTransactionRepository.findById(id, tenantId, { transaction });
    });
  }

  async reverseTransaction(id, tenantId, userId) {
    const txn = await bankTransactionRepository.findById(id, tenantId);
    if (!txn) throw new NotFoundError('Bank transaction not found');
    if (txn.status !== 'Posted') throw new BadRequestError(`Cannot reverse transaction with status "${txn.status}"`);
    if (txn.isReconciled) {
      throw new BadRequestError('Cannot reverse a reconciled transaction. Reverse the reconciliation first.');
    }

    return await sequelize.transaction(async (transaction) => {
      const bankAccount = await BankAccount.findOne({
        where: { id: txn.bankAccountId, tenantId },
        include: [{ model: Account, as: 'chartOfAccount' }],
        transaction,
      });

      if (!bankAccount || !bankAccount.chartOfAccount) {
        throw new BadRequestError('Bank account chart of account not configured');
      }

      const bankCoaId = bankAccount.chartOfAccount.id;
      const amount = txn.direction === 'In' ? parseFloat(txn.creditAmount) : parseFloat(txn.debitAmount);
      const reverseDirection = txn.direction === 'In' ? 'Out' : 'In';

      // Create reversal journal entry (opposite entries)
      let lines;
      if (reverseDirection === 'In') {
        lines = [
          { accountId: bankCoaId, debit: amount, credit: 0 },
          { accountId: txn.offsetAccountId, debit: 0, credit: amount },
        ];
      } else {
        lines = [
          { accountId: txn.offsetAccountId, debit: amount, credit: 0 },
          { accountId: bankCoaId, debit: 0, credit: amount },
        ];
      }

      const journalData = {
        lines,
        entryDate: new Date().toISOString().split('T')[0],
        reference: `REV-${txn.transactionNumber}`,
        description: `Reversal of ${txn.transactionNumber} - ${txn.description || txn.transactionType}`,
      };

      const journalEntry = await journalEntryService.createEntry(journalData, tenantId, userId, transaction);

      // Post the reversal journal entry so it appears in General Ledger
      const { JournalEntry: JournalEntryModel } = require('../models');
      await JournalEntryModel.update(
        { status: 'posted', postedAt: new Date(), postedBy: userId, updatedBy: userId },
        { where: { id: journalEntry.id, tenantId }, transaction }
      );

      // Generate reverse transaction number
      const revNumber = await bankTransactionRepository.generateTransactionNumber(tenantId);
      const currentBalance = await bankTransactionRepository.getRunningBalance(txn.bankAccountId, tenantId);
      const newBalance = reverseDirection === 'In' ? currentBalance + amount : currentBalance - amount;

      // Create reversal transaction record
      const reverseTxnData = {
        bankAccountId: txn.bankAccountId,
        transactionNumber: revNumber,
        transactionDate: new Date().toISOString().split('T')[0],
        valueDate: new Date().toISOString().split('T')[0],
        transactionType: txn.transactionType,
        direction: reverseDirection,
        referenceNumber: txn.transactionNumber,
        description: `Reversal of ${txn.transactionNumber}`,
        debitAmount: reverseDirection === 'Out' ? amount : 0,
        creditAmount: reverseDirection === 'In' ? amount : 0,
        runningBalance: newBalance,
        status: 'Posted',
        offsetAccountId: txn.offsetAccountId,
        sourceType: 'reversal',
        sourceId: txn.id,
        journalEntryId: journalEntry.id,
      };

      await bankTransactionRepository.create(reverseTxnData, tenantId, userId, { transaction });

      // Mark original as reversed
      await bankTransactionRepository.update(id, {
        status: 'Reversed',
      }, tenantId, userId, { transaction });

      logger.info(`Bank transaction ${txn.transactionNumber} reversed by user ${userId}`);
      return await bankTransactionRepository.findById(id, tenantId, { transaction });
    });
  }

  async deleteTransaction(id, tenantId) {
    const txn = await bankTransactionRepository.findById(id, tenantId);
    if (!txn) throw new NotFoundError('Bank transaction not found');
    if (txn.status !== 'Draft') throw new BadRequestError('Only draft transactions can be deleted');
    if (txn.isReconciled) throw new BadRequestError('Cannot delete reconciled transaction');

    await bankTransactionRepository.delete(id, tenantId, false);
    logger.info(`Bank transaction ${txn.transactionNumber} deleted from tenant ${tenantId}`);
    return true;
  }

  async getUnreconciledTransactions(bankAccountId, tenantId) {
    return await bankTransactionRepository.findUnreconciledByBankAccount(bankAccountId, tenantId);
  }

  async importCSV(data, tenantId, userId) {
    const { bankAccountId, transactions } = data;

    const bankAccount = await bankAccountRepository.findById(bankAccountId, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');

    const created = [];
    let currentBalance = await bankTransactionRepository.getRunningBalance(bankAccountId, tenantId);

    for (const row of transactions) {
      const direction = parseFloat(row.amount) >= 0 ? 'In' : 'Out';
      const absAmount = Math.abs(parseFloat(row.amount));

      const transactionNumber = await bankTransactionRepository.generateTransactionNumber(tenantId);
      currentBalance = direction === 'In' ? currentBalance + absAmount : currentBalance - absAmount;

      const txnData = {
        bankAccountId,
        transactionNumber,
        transactionDate: row.date || new Date().toISOString().split('T')[0],
        valueDate: row.valueDate || row.date || null,
        transactionType: 'Imported Statement',
        direction,
        referenceNumber: row.reference || null,
        externalReference: row.externalRef || null,
        description: row.description || null,
        debitAmount: direction === 'Out' ? absAmount : 0,
        creditAmount: direction === 'In' ? absAmount : 0,
        runningBalance: currentBalance,
        status: 'Draft',
        notes: 'Imported from CSV statement',
      };

      const txn = await bankTransactionRepository.create(txnData, tenantId, userId);
      created.push(txn);
    }

    logger.info(`${created.length} bank transactions imported via CSV for bank account ${bankAccountId}`);
    return created;
  }
}

module.exports = new BankTransactionService();
