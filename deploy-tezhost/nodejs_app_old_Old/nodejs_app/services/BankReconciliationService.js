const reconciliationRepository = require('../repositories/BankReconciliationRepository');
const bankAccountRepository = require('../repositories/BankAccountRepository');
const { BankTransaction, BankAccount, sequelize } = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/appError');
const logger = require('../utils/logger');

class BankReconciliationService {
  async getReconciliations(tenantId, query = {}) {
    const { page = 1, limit = 20, search, bankAccountId, status, startDate, endDate } = query;
    return await reconciliationRepository.findAndCountAll(tenantId, { page: parseInt(page, 10), limit: parseInt(limit, 10), search, bankAccountId, status, startDate, endDate });
  }

  async getReconciliationById(id, tenantId) {
    const rec = await reconciliationRepository.findById(id, tenantId);
    if (!rec) throw new NotFoundError('Bank reconciliation not found');
    return rec;
  }

  async createReconciliation(data, tenantId, userId) {
    const bankAccount = await bankAccountRepository.findById(data.bankAccountId, tenantId);
    if (!bankAccount) throw new NotFoundError('Bank account not found');

    // Check no active reconciliation exists for this period
    const existing = await reconciliationRepository.findOne(tenantId, {
      bankAccountId: data.bankAccountId,
      status: { [require('sequelize').Op.notIn]: ['Reversed', 'Closed'] },
    });
    if (existing) throw new BadRequestError('An active reconciliation already exists for this bank account');

    // Get system closing balance
    const systemClosingBalance = await reconciliationRepository.getSystemClosingBalance(data.bankAccountId, tenantId, data.statementDateTo);
    const difference = parseFloat(data.statementClosingBalance || 0) - systemClosingBalance;

    const recNumber = await reconciliationRepository.generateReconciliationNumber(tenantId);
    const recData = {
      reconciliationNumber: recNumber, bankAccountId: data.bankAccountId,
      statementDateFrom: data.statementDateFrom, statementDateTo: data.statementDateTo,
      statementOpeningBalance: parseFloat(data.statementOpeningBalance || 0),
      statementClosingBalance: parseFloat(data.statementClosingBalance || 0),
      systemClosingBalance, differenceAmount: difference,
      status: 'Draft', notes: data.notes || null,
    };

    const rec = await reconciliationRepository.createWithLines(recData, [], tenantId, userId);
    logger.info(`Bank reconciliation ${recNumber} created for account ${data.bankAccountId}`);
    return await reconciliationRepository.findById(rec.id, tenantId);
  }

  async importStatementLines(id, data, tenantId) {
    const rec = await reconciliationRepository.findById(id, tenantId);
    if (!rec) throw new NotFoundError('Bank reconciliation not found');
    if (!['Draft', 'InProgress'].includes(rec.status)) throw new BadRequestError('Cannot add lines to a completed reconciliation');

    const lines = data.lines.map((l) => ({
      statementTransactionDate: l.statementTransactionDate || null,
      statementReference: l.statementReference || null,
      statementDescription: l.statementDescription || null,
      statementDebitAmount: parseFloat(l.statementDebitAmount || 0),
      statementCreditAmount: parseFloat(l.statementCreditAmount || 0),
      matchStatus: 'Unmatched', matchType: 'None',
    }));

    await reconciliationRepository.addLines(rec.id, lines, tenantId);
    await reconciliationRepository.update(rec.id, { status: 'InProgress' }, tenantId);

    // Auto-match
    await this._autoMatch(rec.id, tenantId);

    // Recalculate
    await this._recalculate(rec.id, tenantId);

    return await reconciliationRepository.findById(rec.id, tenantId);
  }

  async _autoMatch(reconciliationId, tenantId) {
    const rec = await reconciliationRepository.findById(reconciliationId, tenantId);
    if (!rec) return;

    const unmatchedLines = rec.lines.filter((l) => l.matchStatus === 'Unmatched');
    const systemTxns = await reconciliationRepository.getUnmatchedSystemTransactions(
      rec.bankAccountId, tenantId, rec.statementDateFrom, rec.statementDateTo
    );
    const availableTxns = systemTxns.filter((t) => !t.isReconciled);

    for (const line of unmatchedLines) {
      const lineAmount = parseFloat(line.statementDebitAmount) || parseFloat(line.statementCreditAmount) || 0;
      if (lineAmount <= 0) continue;

      // Try exact match by amount + date
      let match = availableTxns.find((t) => {
        const txnAmount = parseFloat(t.debitAmount) || parseFloat(t.creditAmount) || 0;
        return Math.abs(txnAmount - lineAmount) < 0.01 &&
          t.transactionDate === line.statementTransactionDate;
      });

      // Try by amount + reference
      if (!match && line.statementReference) {
        match = availableTxns.find((t) => {
          const txnAmount = parseFloat(t.debitAmount) || parseFloat(t.creditAmount) || 0;
          return Math.abs(txnAmount - lineAmount) < 0.01 &&
            (t.referenceNumber === line.statementReference || t.transactionNumber === line.statementReference);
        });
      }

      // Try by amount only
      if (!match) {
        match = availableTxns.find((t) => {
          const txnAmount = parseFloat(t.debitAmount) || parseFloat(t.creditAmount) || 0;
          return Math.abs(txnAmount - lineAmount) < 0.01;
        });
      }

      if (match) {
        await reconciliationRepository.updateLineMatch(line.id, match.id, 'Matched', 'Automatic');
        const idx = availableTxns.indexOf(match);
        if (idx > -1) availableTxns.splice(idx, 1);
      }
    }
  }

  async manualMatch(reconciliationId, lineId, bankTransactionId, tenantId) {
    const rec = await reconciliationRepository.findById(reconciliationId, tenantId);
    if (!rec) throw new NotFoundError('Reconciliation not found');
    if (rec.status === 'Reconciled' || rec.status === 'Closed') throw new BadRequestError('Reconciliation is already completed');

    const line = rec.lines.find((l) => l.id === lineId);
    if (!line) throw new NotFoundError('Reconciliation line not found');

    if (bankTransactionId) {
      const txn = await BankTransaction.findOne({ where: { id: bankTransactionId, tenantId } });
      if (!txn) throw new NotFoundError('Bank transaction not found');
      if (txn.isReconciled) throw new BadRequestError('Bank transaction is already reconciled in another reconciliation');
    }

    await reconciliationRepository.updateLineMatch(lineId, bankTransactionId || null, bankTransactionId ? 'Matched' : 'Unmatched', 'Manual');
    await this._recalculate(reconciliationId, tenantId);
    return await reconciliationRepository.findById(reconciliationId, tenantId);
  }

  async unmatchLine(reconciliationId, lineId, tenantId) {
    const rec = await reconciliationRepository.findById(reconciliationId, tenantId);
    if (!rec) throw new NotFoundError('Reconciliation not found');
    if (rec.status === 'Reconciled' || rec.status === 'Closed') throw new BadRequestError('Reconciliation is already completed');

    await reconciliationRepository.updateLineMatch(lineId, null, 'Unmatched', 'Manual');
    await this._recalculate(reconciliationId, tenantId);
    return await reconciliationRepository.findById(reconciliationId, tenantId);
  }

  async _recalculate(reconciliationId, tenantId) {
    const rec = await reconciliationRepository.findById(reconciliationId, tenantId);
    if (!rec) return;

    const systemClosingBalance = await reconciliationRepository.getSystemClosingBalance(rec.bankAccountId, tenantId, rec.statementDateTo);
    const difference = parseFloat(rec.statementClosingBalance || 0) - systemClosingBalance;

    await reconciliationRepository.update(reconciliationId, { systemClosingBalance, differenceAmount: difference }, tenantId);
  }

  async completeReconciliation(id, tenantId, userId) {
    const rec = await reconciliationRepository.findById(id, tenantId);
    if (!rec) throw new NotFoundError('Reconciliation not found');
    if (rec.status !== 'Draft' && rec.status !== 'InProgress') throw new BadRequestError(`Cannot complete reconciliation with status "${rec.status}"`);

    const difference = parseFloat(rec.differenceAmount || 0);
    if (Math.abs(difference) > 0.01) {
      throw new BadRequestError(`Reconciliation difference is ${difference.toFixed(2)}. It must be zero to complete. Use an adjustment transaction or override.`);
    }

    return await sequelize.transaction(async (transaction) => {
      await reconciliationRepository.update(id, {
        status: 'Reconciled', reconciledAt: new Date(), reconciledBy: userId,
      }, tenantId, userId);

      // Mark matched transactions as reconciled
      await reconciliationRepository.markTransactionsReconciled(id, tenantId, userId);

      logger.info(`Bank reconciliation ${rec.reconciliationNumber} completed by user ${userId}`);
      return await reconciliationRepository.findById(id, tenantId);
    });
  }

  async overrideCompleteReconciliation(id, tenantId, userId) {
    const rec = await reconciliationRepository.findById(id, tenantId);
    if (!rec) throw new NotFoundError('Reconciliation not found');
    if (rec.status !== 'Draft' && rec.status !== 'InProgress') throw new BadRequestError(`Cannot complete reconciliation with status "${rec.status}"`);

    return await sequelize.transaction(async (transaction) => {
      await reconciliationRepository.update(id, {
        status: 'Reconciled', reconciledAt: new Date(), reconciledBy: userId,
      }, tenantId, userId);
      await reconciliationRepository.markTransactionsReconciled(id, tenantId, userId);
      logger.info(`Bank reconciliation ${rec.reconciliationNumber} force-completed with override by user ${userId}`);
      return await reconciliationRepository.findById(id, tenantId);
    });
  }

  async reverseReconciliation(id, tenantId, userId) {
    const rec = await reconciliationRepository.findById(id, tenantId);
    if (!rec) throw new NotFoundError('Reconciliation not found');
    if (rec.status !== 'Reconciled') throw new BadRequestError('Only reconciled reconciliations can be reversed');

    return await sequelize.transaction(async (transaction) => {
      await reconciliationRepository.unmarkTransactionsReconciled(id, tenantId);
      await reconciliationRepository.update(id, { status: 'Reversed', updatedBy: userId }, tenantId, userId);
      logger.info(`Bank reconciliation ${rec.reconciliationNumber} reversed by user ${userId}`);
      return await reconciliationRepository.findById(id, tenantId);
    });
  }

  async deleteReconciliation(id, tenantId) {
    const rec = await reconciliationRepository.findById(id, tenantId);
    if (!rec) throw new NotFoundError('Reconciliation not found');
    if (rec.status !== 'Draft') throw new BadRequestError('Only draft reconciliations can be deleted');
    await reconciliationRepository.delete(id, tenantId, false);
    logger.info(`Bank reconciliation ${rec.reconciliationNumber} deleted`);
    return true;
  }

  async getUnmatchedSystemTransactions(bankAccountId, tenantId, dateFrom, dateTo) {
    return await reconciliationRepository.getUnmatchedSystemTransactions(bankAccountId, tenantId, dateFrom, dateTo);
  }
}

module.exports = new BankReconciliationService();
