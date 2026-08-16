const BaseRepository = require('./BaseRepository');
const { AssetDepreciation, Asset, User } = require('../models');
const { Op } = require('sequelize');

class AssetDepreciationRepository extends BaseRepository {
  constructor() { super(AssetDepreciation); }

  async findByNumber(number, tenantId) {
    return await this.model.findOne({ where: { depreciationNumber: number, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'assetCode', 'assetName', 'purchaseCost', 'residualValue', 'usefulLife', 'depreciationMethod', 'accumulatedDepreciation', 'currentBookValue'], required: false },
        { model: User, as: 'creator', attributes: ['id', 'username', 'firstName', 'lastName'], required: false },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) where[Op.or] = [{ depreciationNumber: { [Op.like]: `%${search}%` } }];
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

  async getNextDepreciationNumber(tenantId) {
    const last = await this.findLastNumber(tenantId);
    if (!last) return 'DEP-000001';
    const num = parseInt(last.depreciationNumber.replace('DEP-', ''), 10) + 1;
    return `DEP-${String(num).padStart(6, '0')}`;
  }

  async findPostedByAsset(assetId, tenantId) {
    return await this.model.findAll({
      where: { assetId, tenantId, isPosted: true },
      order: [['depreciationDate', 'DESC']],
    });
  }
}

module.exports = new AssetDepreciationRepository();
