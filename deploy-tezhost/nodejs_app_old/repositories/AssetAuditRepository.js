const BaseRepository = require('./BaseRepository');
const { AssetAudit, Asset, User } = require('../models');
const { Op } = require('sequelize');

class AssetAuditRepository extends BaseRepository {
  constructor() {
    super(AssetAudit);
  }

  async findByNumber(number, tenantId) {
    return await this.model.findOne({ where: { auditNumber: number, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Asset,
          as: 'asset',
          attributes: ['id', 'assetCode', 'assetName'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
        },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) {
      where[Op.or] = [
        { auditNumber: { [Op.like]: `%${search}%` } },
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
          model: Asset,
          as: 'asset',
          attributes: ['id', 'assetCode', 'assetName'],
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

  async findLastNumber(tenantId) {
    return await this.model.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      paranoid: false,
    });
  }

  async getNextAuditNumber(tenantId) {
    const last = await this.findLastNumber(tenantId);
    if (!last) return 'AUD-000001';
    const num = parseInt(last.auditNumber.replace('AUD-', ''), 10) + 1;
    return `AUD-${String(num).padStart(6, '0')}`;
  }
}

module.exports = new AssetAuditRepository();
