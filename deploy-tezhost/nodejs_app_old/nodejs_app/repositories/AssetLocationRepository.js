const BaseRepository = require('./BaseRepository');
const { AssetLocation, User } = require('../models');
const { Op } = require('sequelize');

class AssetLocationRepository extends BaseRepository {
  constructor() {
    super(AssetLocation);
  }

  async findByCode(code, tenantId) {
    return await this.model.findOne({ where: { locationCode: code, tenantId } });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
      include: [
        {
          model: AssetLocation,
          as: 'parent',
          attributes: ['id', 'locationCode', 'locationName'],
        },
        {
          model: AssetLocation,
          as: 'children',
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
        },
      ],
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['locationCode', 'ASC']], search = '' } = {}) {
    const where = { tenantId, ...filters };
    if (search) {
      where[Op.or] = [
        { locationCode: { [Op.like]: `%${search}%` } },
        { locationName: { [Op.like]: `%${search}%` } },
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
          model: AssetLocation,
          as: 'parent',
          attributes: ['id', 'locationCode', 'locationName'],
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
      order: [['locationName', 'ASC']],
    });
  }

  async findLastNumber(tenantId) {
    return await this.model.findOne({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
      paranoid: false,
    });
  }
}

module.exports = new AssetLocationRepository();
