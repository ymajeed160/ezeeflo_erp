const BaseRepository = require('./BaseRepository');
const { AssetRevaluation, Asset, User } = require('../models');
const { Op } = require('sequelize');

class AssetRevaluationRepository extends BaseRepository {
  constructor() { super(AssetRevaluation); }

  async findByNumber(number, tenantId) {
    return await this.model.findOne({ where: { revaluationNumber: number, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName', 'purchaseCost', 'currentBookValue'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'], required: false },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) where[Op.or] = [{ revaluationNumber: { [Op.like]: `%${search}%` } }];
    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where, limit, offset, order, distinct: true,
      include: [{ model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName'], required: false }],
    });
    return { rows: result.rows, count: result.count, pagination: { page, limit, total: result.count, totalPages: Math.ceil(result.count / limit), hasNext: page * limit < result.count, hasPrev: page > 1 } };
  }

  async findLastNumber(tenantId) {
    return await this.model.findOne({ where: { tenantId }, order: [['createdAt', 'DESC']], paranoid: false });
  }

  async getNextRevaluationNumber(tenantId) {
    const last = await this.findLastNumber(tenantId);
    if (!last) return 'REV-000001';
    const num = parseInt(last.revaluationNumber.replace('REV-', ''), 10) + 1;
    return `REV-${String(num).padStart(6, '0')}`;
  }
}

module.exports = new AssetRevaluationRepository();
