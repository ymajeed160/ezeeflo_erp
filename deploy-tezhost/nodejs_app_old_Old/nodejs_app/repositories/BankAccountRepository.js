const BaseRepository = require('./BaseRepository');
const { BankAccount, Account, User } = require('../models');
const { Op } = require('sequelize');

class BankAccountRepository extends BaseRepository {
  constructor() {
    super(BankAccount);
  }

  async findByCode(code, tenantId) {
    return await this.model.findOne({ where: { accountCode: code, tenantId } });
  }

  async findByAccountNumber(accountNumber, tenantId) {
    return await this.model.findOne({ where: { accountNumber, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Account,
          as: 'chartOfAccount',
          attributes: ['id', 'code', 'name', 'type'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'firstName', 'lastName'],
        },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['accountCode', 'ASC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) {
      where[Op.or] = [
        { accountCode: { [Op.like]: `%${search}%` } },
        { accountName: { [Op.like]: `%${search}%` } },
        { bankName: { [Op.like]: `%${search}%` } },
        { accountNumber: { [Op.like]: `%${search}%` } },
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
          model: Account,
          as: 'chartOfAccount',
          attributes: ['id', 'code', 'name', 'type'],
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

  async findActive(tenantId) {
    return await this.model.findAll({
      where: { tenantId, isActive: true },
      order: [['accountName', 'ASC']],
      include: [
        {
          model: Account,
          as: 'chartOfAccount',
          attributes: ['id', 'code', 'name', 'type'],
        },
      ],
    });
  }

  async findDefault(tenantId, currencyCode = null) {
    const where = { tenantId, isDefault: true, isActive: true };
    if (currencyCode) {
      where.currencyCode = currencyCode;
    }
    return await this.model.findOne({ where });
  }

  async clearDefaultFlag(tenantId, currencyCode, excludeId = null) {
    const where = { tenantId, isDefault: true };
    if (currencyCode) {
      where.currencyCode = currencyCode;
    }
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    await this.model.update({ isDefault: false }, { where });
  }

  async countByChartAccountId(chartOfAccountId, tenantId) {
    return await this.model.count({ where: { chartOfAccountId, tenantId } });
  }
}

module.exports = new BankAccountRepository();
