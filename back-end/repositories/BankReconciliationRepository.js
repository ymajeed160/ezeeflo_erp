const BaseRepository = require('./BaseRepository');
const { BankReconciliation, BankReconciliationLine, BankTransaction, BankAccount, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class BankReconciliationRepository extends BaseRepository {
  constructor() { super(BankReconciliation); }

  async findByNumber(number, tenantId) {
    return await this.model.findOne({ where: { reconciliationNumber: number, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountCode', 'accountName', 'accountNumber', 'currencyCode'] },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'] },
        { model: User, as: 'reconciler', attributes: ['id', 'username', 'firstName', 'lastName'] },
        {
          model: BankReconciliationLine, as: 'lines',
          include: [{ model: BankTransaction, as: 'bankTransaction', attributes: ['id', 'transactionNumber', 'transactionDate', 'transactionType', 'direction', 'debitAmount', 'creditAmount', 'description'] }],
          order: [['statementTransactionDate', 'ASC']],
        },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], bankAccountId, status, startDate, endDate, search } = {}) {
    const where = { tenantId, ...filters };
    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (status) where.status = status;
    if (startDate || endDate) { where.statementDateFrom = {}; if (startDate) where.statementDateFrom[Op.gte] = startDate; if (endDate) where.statementDateTo = { [Op.lte]: endDate }; }
    if (search) { where[Op.or] = [{ reconciliationNumber: { [Op.like]: `%${search}%` } }, { notes: { [Op.like]: `%${search}%` } }]; }
    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where, limit, offset, order, distinct: true,
      include: [{ model: BankAccount, as: 'bankAccount', attributes: ['id', 'accountCode', 'accountName'] }],
    });
    return { rows: result.rows, count: result.count, pagination: { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit), hasNext: page * limit < result.count, hasPrev: page > 1 } };
  }

  async generateReconciliationNumber(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `BR-${year}-`;
    const last = await this.model.findOne({
      where: { tenantId, reconciliationNumber: { [Op.like]: `${prefix}%` } },
      order: [['reconciliationNumber', 'DESC']], attributes: ['reconciliationNumber'], paranoid: false,
    });
    let nextNum = 1;
    if (last) { const parts = last.reconciliationNumber.split('-'); nextNum = parseInt(parts[parts.length - 1], 10) + 1; }
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  async createWithLines(data, lines, tenantId, userId) {
    const rec = await this.model.create({ ...data, tenantId, createdBy: userId, updatedBy: userId });
    if (lines && lines.length > 0) {
      await BankReconciliationLine.bulkCreate(lines.map((l) => ({ ...l, bankReconciliationId: rec.id, tenantId })));
    }
    return rec;
  }

  async addLines(id, lines, tenantId) {
    const lineData = lines.map((l) => ({ ...l, bankReconciliationId: id, tenantId }));
    await BankReconciliationLine.bulkCreate(lineData);
  }

  async updateLineMatch(lineId, bankTransactionId, matchStatus, matchType) {
    await BankReconciliationLine.update({ bankTransactionId, matchStatus, matchType }, { where: { id: lineId } });
  }

  async createAdjustmentLine(id, data, tenantId) {
    await BankReconciliationLine.create({ ...data, bankReconciliationId: id, tenantId });
  }

  async getUnmatchedSystemTransactions(bankAccountId, tenantId, dateFrom, dateTo) {
    return await BankTransaction.findAll({
      where: {
        bankAccountId, tenantId, status: 'Posted',
        transactionDate: { [Op.between]: [dateFrom, dateTo] },
      },
      order: [['transactionDate', 'ASC']],
    });
  }

  async getSystemClosingBalance(bankAccountId, tenantId, dateTo) {
    const result = await BankTransaction.findOne({
      where: { bankAccountId, tenantId, status: 'Posted', transactionDate: { [Op.lte]: dateTo } },
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      attributes: ['runningBalance'],
    });
    return result ? parseFloat(result.runningBalance) : 0;
  }

  async markTransactionsReconciled(reconciliationId, tenantId, userId) {
    const lines = await BankReconciliationLine.findAll({
      where: { bankReconciliationId: reconciliationId, matchStatus: 'Matched', bankTransactionId: { [Op.ne]: null } },
    });
    const txnIds = lines.filter((l) => l.bankTransactionId).map((l) => l.bankTransactionId);
    if (txnIds.length > 0) {
      await BankTransaction.update(
        { isReconciled: true, reconciledAt: new Date(), reconciledBy: userId },
        { where: { id: txnIds, tenantId } }
      );
    }
    return txnIds;
  }

  async unmarkTransactionsReconciled(reconciliationId, tenantId) {
    const lines = await BankReconciliationLine.findAll({
      where: { bankReconciliationId: reconciliationId, matchStatus: 'Matched', bankTransactionId: { [Op.ne]: null } },
    });
    const txnIds = lines.filter((l) => l.bankTransactionId).map((l) => l.bankTransactionId);
    if (txnIds.length > 0) {
      await BankTransaction.update(
        { isReconciled: false, reconciledAt: null, reconciledBy: null },
        { where: { id: txnIds, tenantId } }
      );
    }
    return txnIds;
  }
}

module.exports = new BankReconciliationRepository();
