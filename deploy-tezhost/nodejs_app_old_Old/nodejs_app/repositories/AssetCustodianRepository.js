const BaseRepository = require('./BaseRepository');
const { AssetCustodian, User } = require('../models');
const { Op } = require('sequelize');

class AssetCustodianRepository extends BaseRepository {
  constructor() {
    super(AssetCustodian);
  }

  async findByCode(code, tenantId) {
    return await this.model.findOne({ where: { custodianCode: code, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
        },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['custodianCode', 'ASC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) {
      where[Op.or] = [
        { custodianCode: { [Op.like]: `%${search}%` } },
        { custodianName: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (page - 1) * limit;
    const result = await this.model.findAndCountAll({
      where,
      limit,
      offset,
      order,
      distinct: true,
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
      order: [['custodianName', 'ASC']],
    });
  }
}

module.exports = new AssetCustodianRepository();
