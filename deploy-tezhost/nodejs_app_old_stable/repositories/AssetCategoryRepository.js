const BaseRepository = require('./BaseRepository');
const { AssetCategory, Account, User } = require('../models');
const { Op } = require('sequelize');

class AssetCategoryRepository extends BaseRepository {
  constructor() {
    super(AssetCategory);
  }

  async findByCode(code, tenantId) {
    return await this.model.findOne({ where: { categoryCode: code, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Account,
          as: 'defaultAssetAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'accumulatedDepreciationAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'depreciationExpenseAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'gainOnDisposalAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'lossOnDisposalAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'defaultTaxAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false,
        },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['categoryCode', 'ASC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) {
      where[Op.or] = [
        { categoryCode: { [Op.like]: `%${search}%` } },
        { categoryName: { [Op.like]: `%${search}%` } },
        { depreciationMethod: { [Op.like]: `%${search}%` } },
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
          as: 'defaultAssetAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'accumulatedDepreciationAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'depreciationExpenseAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'gainOnDisposalAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'lossOnDisposalAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
        },
        {
          model: Account,
          as: 'defaultTaxAccount',
          attributes: ['id', 'code', 'name', 'type'],
          required: false,
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
      order: [['categoryName', 'ASC']],
    });
  }
}

module.exports = new AssetCategoryRepository();
