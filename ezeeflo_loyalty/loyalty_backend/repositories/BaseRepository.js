const { Op } = require('sequelize');
const logger = require('../utils/logger');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, companyId = null, options = {}) {
    const where = { id };
    if (companyId) where.companyId = companyId;
    return await this.model.findOne({ where, ...options });
  }

  async findAndCountAll(companyId, { page = 1, limit = 20, filters = {}, order = [['created_at', 'DESC']], include = [], attributes = null, paranoid = true } = {}) {
    const where = { companyId, ...filters };
    const offset = (page - 1) * limit;
    const queryOptions = { where, limit, offset, order, include, distinct: true };
    if (attributes) queryOptions.attributes = attributes;
    if (!paranoid && this.model.options.paranoid !== false) queryOptions.paranoid = false;

    const result = await this.model.findAndCountAll(queryOptions);
    return {
      rows: result.rows,
      count: result.count,
      pagination: {
        page, limit, total: result.count,
        totalPages: Math.ceil(result.count / limit),
        hasNext: page * limit < result.count,
        hasPrev: page > 1,
      },
    };
  }

  async create(data, companyId = null, userId = null, options = {}) {
    const payload = { ...data };
    if (companyId) payload.companyId = companyId;
    if (userId) { payload.createdBy = userId; payload.updatedBy = userId; }
    return await this.model.create(payload, { ...options });
  }

  async update(id, data, companyId = null, userId = null, options = {}) {
    const where = { id };
    if (companyId) where.companyId = companyId;
    if (userId) data.updatedBy = userId;
    const [affected] = await this.model.update(data, { where, ...options });
    return affected > 0;
  }

  async delete(id, companyId = null, hardDelete = false) {
    const where = { id };
    if (companyId) where.companyId = companyId;
    if (hardDelete) {
      return await this.model.destroy({ where, force: true });
    }
    return await this.model.destroy({ where });
  }
}

module.exports = BaseRepository;
