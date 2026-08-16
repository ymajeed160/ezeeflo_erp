const BaseRepository = require('./BaseRepository');
const { Asset, AssetCategory, Supplier, PurchaseInvoice, User } = require('../models');
const { Op } = require('sequelize');

class AssetRepository extends BaseRepository {
  constructor() {
    super(Asset);
  }

  async findByCode(code, tenantId) {
    return await this.model.findOne({ where: { assetCode: code, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: this._defaultIncludes(),
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) {
      where[Op.or] = [
        { assetCode: { [Op.like]: `%${search}%` } },
        { assetName: { [Op.like]: `%${search}%` } },
        { serialNumber: { [Op.like]: `%${search}%` } },
        { manufacturer: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
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
          model: AssetCategory,
          as: 'category',
          attributes: ['id', 'categoryCode', 'categoryName', 'depreciationMethod', 'usefulLifeYears'],
          required: false,
        },
        {
          model: Supplier,
          as: 'supplier',
          attributes: ['id', 'code', 'name'],
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
      where: { tenantId, status: 'active' },
      order: [['assetName', 'ASC']],
      include: [
        {
          model: AssetCategory,
          as: 'category',
          attributes: ['id', 'categoryCode', 'categoryName'],
          required: false,
        },
      ],
    });
  }

  async findLastCode(tenantId) {
    return await this.model.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC'], ['assetCode', 'DESC']],
      paranoid: false,
    });
  }

  async getNextAssetCode(tenantId) {
    const last = await this.findLastCode(tenantId);
    if (!last) return 'AST-000001';
    const numStr = last.assetCode.replace('AST-', '');
    const num = parseInt(numStr, 10);
    const next = num + 1;
    return `AST-${String(next).padStart(6, '0')}`;
  }

  _defaultIncludes() {
    return [
      {
        model: AssetCategory,
        as: 'category',
        attributes: ['id', 'categoryCode', 'categoryName', 'depreciationMethod', 'usefulLifeYears', 'residualValuePercentage', 'defaultAssetAccountId', 'accumulatedDepreciationAccountId', 'depreciationExpenseAccountId', 'gainOnDisposalAccountId', 'lossOnDisposalAccountId'],
        required: false,
      },
      {
        model: Supplier,
        as: 'supplier',
        attributes: ['id', 'code', 'name'],
        required: false,
      },
      {
        model: PurchaseInvoice,
        as: 'purchaseInvoice',
        attributes: ['id', 'invoiceNumber'],
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
    ];
  }
}

module.exports = new AssetRepository();
