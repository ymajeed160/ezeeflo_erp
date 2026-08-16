const { Op } = require('sequelize');
const logger = require('../utils/logger');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, tenantId = null, options = {}) {
    try {
      const where = { id };
      if (tenantId) where.tenantId = tenantId;
      return await this.model.findOne({ where, ...options });
    } catch (error) {
      logger.error(`${this.model.name} findById error:`, { error: error.message });
      throw error;
    }
  }

  async findAll(tenantId, filters = {}, options = {}) {
    try {
      const where = { tenantId, ...filters };
      return await this.model.findAll({ where, ...options });
    } catch (error) {
      logger.error(`${this.model.name} findAll error:`, { error: error.message });
      throw error;
    }
  }

  async findAndCountAll(tenantId, { page = 1, limit = 20, filters = {}, order = [['created_at', 'DESC']], include = [], attributes = null, paranoid = true } = {}) {
    try {
      const where = { tenantId, ...filters };
      const offset = (page - 1) * limit;
      const queryOptions = {
        where,
        limit,
        offset,
        order,
        include,
        distinct: true,
      };
      if (attributes) queryOptions.attributes = attributes;
      if (!paranoid && this.model.options.paranoid !== false) {
        queryOptions.paranoid = false;
      }

      const result = await this.model.findAndCountAll(queryOptions);
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
    } catch (error) {
      logger.error(`${this.model.name} findAndCountAll error:`, { error: error.message });
      throw error;
    }
  }

  async create(data, tenantId = null, userId = null, options = {}) {
    try {
      const payload = { ...data };
      if (tenantId) payload.tenantId = tenantId;
      if (userId) {
        payload.createdBy = userId;
        payload.updatedBy = userId;
      }
      return await this.model.create(payload, { ...options });
    } catch (error) {
      logger.error(`${this.model.name} create error:`, { error: error.message });
      throw error;
    }
  }

  async update(id, data, tenantId = null, userId = null, options = {}) {
    try {
      const where = { id };
      if (tenantId) where.tenantId = tenantId;

      const payload = { ...data };
      if (userId) payload.updatedBy = userId;

      const [affectedCount] = await this.model.update(payload, { where, ...options });
      if (affectedCount === 0) return null;

      return await this.model.findOne({ where, ...options });
    } catch (error) {
      logger.error(`${this.model.name} update error:`, { error: error.message });
      throw error;
    }
  }

  async delete(id, tenantId = null, softDelete = true) {
    try {
      const where = { id };
      if (tenantId) where.tenantId = tenantId;

      const instance = await this.model.findOne({ where });
      if (!instance) return false;

      if (softDelete && this.model.options.paranoid !== false) {
        await instance.destroy();
      } else {
        await instance.destroy({ force: true });
      }
      return true;
    } catch (error) {
      logger.error(`${this.model.name} delete error:`, { error: error.message });
      throw error;
    }
  }

  async findOne(tenantId, filters = {}, options = {}) {
    try {
      const where = { tenantId, ...filters };
      return await this.model.findOne({ where, ...options });
    } catch (error) {
      logger.error(`${this.model.name} findOne error:`, { error: error.message });
      throw error;
    }
  }

  async bulkCreate(records, tenantId = null, userId = null) {
    try {
      const payloads = records.map(r => {
        const p = { ...r };
        if (tenantId) p.tenantId = tenantId;
        if (userId) {
          p.createdBy = userId;
          p.updatedBy = userId;
        }
        return p;
      });
      return await this.model.bulkCreate(payloads);
    } catch (error) {
      logger.error(`${this.model.name} bulkCreate error:`, { error: error.message });
      throw error;
    }
  }

  async count(tenantId, filters = {}) {
    try {
      return await this.model.count({ where: { tenantId, ...filters } });
    } catch (error) {
      logger.error(`${this.model.name} count error:`, { error: error.message });
      throw error;
    }
  }
}

module.exports = BaseRepository;