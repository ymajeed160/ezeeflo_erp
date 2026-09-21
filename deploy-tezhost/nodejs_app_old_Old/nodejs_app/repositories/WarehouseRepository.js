const BaseRepository = require('./BaseRepository');
const { Warehouse } = require('../models');
const { Op } = require('sequelize');

class WarehouseRepository extends BaseRepository {
  constructor() {
    super(Warehouse);
  }

  async findByCode(code, tenantId) {
    return await this.model.findOne({
      where: { code, tenantId },
    });
  }

  async findByName(name, tenantId) {
    return await this.model.findOne({
      where: { name, tenantId },
    });
  }

  async findById(id, tenantId) {
    return await this.model.findOne({
      where: { id, tenantId },
    });
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['code', 'ASC']], search = '' } = {}) {
    const where = { tenantId, ...filters };

    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
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
      order: [['name', 'ASC']],
    });
  }

  async search(tenantId, searchTerm, filters = {}) {
    return await this.model.findAll({
      where: {
        tenantId,
        ...filters,
        [Op.or]: [
          { code: { [Op.like]: `%${searchTerm}%` } },
          { name: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
      order: [['name', 'ASC']],
    });
  }
}

module.exports = new WarehouseRepository();