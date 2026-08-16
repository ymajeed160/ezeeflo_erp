const BaseRepository = require('./BaseRepository');
const { BankTransaction, BankAccount, Account, JournalEntry, User } = require('../models');
const { Op, literal } = require('sequelize');

class BankTransactionRepository extends BaseRepository {
  constructor() {
    super(BankTransaction);
  }

  async findByNumber(transactionNumber, tenantId) {
    return await this.model.findOne({ where: { transactionNumber, tenantId } });
  }

  async findById(id, tenantId, options = {}) {
    return await this.model.findOne({
      where: { id, tenantId },
      ...options,
      include: [
        {
          model: BankAccount,
          as: 'bankAccount',
          attributes: ['id', 'accountCode', 'accountName', 'accountNumber', 'currencyCode'],
        },
        {
          model: Account,
          as: 'offsetAccount',
          required: false,
          attributes: ['id', 'code', 'name'],
        },
        {
          model: JournalEntry,
          as: 'journalEntry',
          required: false,
          attributes: ['id', 'entryNumber'],
        },
        {
          model: User,
          as: 'creator',
          required: false,
          attributes: ['id', 'username', 'firstName', 'lastName'],
        },
      ],
    });
  }

  async findAndCountAll(tenantId, {
    page = 1,
    limit = 20,
    filters = {},
    order = [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
    search = '',
    bankAccountId,
    startDate,
    endDate,
    status,
    transactionType,
    isReconciled,
  } = {}) {
    const where = { tenantId, ...filters };

    if (bankAccountId) where.bankAccountId = bankAccountId;
    if (status) where.status = status;
    if (transactionType) where.transactionType = transactionType;
    if (isReconciled !== undefined) where.isReconciled = isReconciled === 'true' || isReconciled === true;

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate[Op.gte] = startDate;
      if (endDate) where.transactionDate[Op.lte] = endDate;
    }

    if (search) {
      where[Op.or] = [
        { transactionNumber: { [Op.like]: `%${search}%` } },
        { referenceNumber: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { externalReference: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
      include: [
        {
          model: BankAccount,
          as: 'bankAccount',
          attributes: ['id', 'accountCode', 'accountName', 'accountNumber', 'currencyCode'],
        },
        {
          model: Account,
          as: 'offsetAccount',
          required: false,
          attributes: ['id', 'code', 'name'],
        },
      ],
    });

    return {
      rows: result.rows,
      count: result.count,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
        hasNext: page * limit < result.count,
        hasPrev: page > 1,
      },
    };
  }

  async getRunningBalance(bankAccountId, tenantId) {
    const result = await this.model.findOne({
      where: { bankAccountId, tenantId, status: 'Posted' },
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      attributes: ['runningBalance'],
    });
    return result ? parseFloat(result.runningBalance) : 0;
  }

  async generateTransactionNumber(tenantId) {
    const year = new Date().getFullYear();
    const prefix = `BT-${year}-`;
    const lastTransaction = await this.model.findOne({
      where: {
        tenantId,
        transactionNumber: { [Op.like]: `${prefix}%` },
      },
      order: [['transactionNumber', 'DESC']],
      attributes: ['transactionNumber'],
      paranoid: false,
    });

    let nextNum = 1;
    if (lastTransaction) {
      const parts = lastTransaction.transactionNumber.split('-');
      nextNum = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(nextNum).padStart(5, '0')}`;
  }

  async findUnreconciledByBankAccount(bankAccountId, tenantId) {
    return await this.model.findAll({
      where: {
        bankAccountId,
        tenantId,
        status: 'Posted',
        isReconciled: false,
      },
      order: [['transactionDate', 'ASC'], ['createdAt', 'ASC']],
    });
  }

  async getBalanceAtDate(bankAccountId, tenantId, date) {
    const result = await this.model.findOne({
      where: {
        bankAccountId,
        tenantId,
        status: 'Posted',
        transactionDate: { [Op.lte]: date },
      },
      order: [['transactionDate', 'DESC'], ['createdAt', 'DESC']],
      attributes: ['runningBalance'],
    });
    return result ? parseFloat(result.runningBalance) : 0;
  }
}

module.exports = new BankTransactionRepository();
