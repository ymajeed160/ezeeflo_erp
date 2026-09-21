const BaseRepository = require('./BaseRepository');
const { AssetTransfer, Asset, User } = require('../models');
const { Op } = require('sequelize');

class AssetTransferRepository extends BaseRepository {
  constructor() { super(AssetTransfer); }

  async findByNumber(number, tenantId) {
    return await this.model.findOne({ where: { transferNumber: number, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName', 'location', 'department', 'custodian'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'], required: false },
        { model: User, as: 'updater', attributes: ['id', 'username', 'firstName', 'lastName'], required: false },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) {
      where[Op.or] = [
        { transferNumber: { [Op.like]: `%${search}%` } },
        { reason: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where, limit, offset, order, distinct: true,
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName'], required: false },
      ],
    });
    return {
      rows: result.rows, count: result.count,
      pagination: { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit), hasNext: page * limit < result.count, hasPrev: page > 1 },
    };
  }

  async findLastNumber(tenantId) {
    return await this.model.findOne({ where: { tenantId }, order: [['createdAt', 'DESC']], paranoid: false });
  }

  async getNextTransferNumber(tenantId) {
    const last = await this.findLastNumber(tenantId);
    if (!last) return 'ATR-000001';
    const num = parseInt(last.transferNumber.replace('ATR-', ''), 10) + 1;
    return `ATR-${String(num).padStart(6, '0')}`;
  }

  async findByAsset(assetId, tenantId) {
    return await this.model.findAll({
      where: { assetId, tenantId },
      order: [['createdAt', 'DESC']],
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName'], required: false },
      ],
    });
  }
}

module.exports = new AssetTransferRepository();
