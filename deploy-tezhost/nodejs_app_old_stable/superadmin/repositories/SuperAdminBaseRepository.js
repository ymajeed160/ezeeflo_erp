const logger = require('../../utils/logger');

class SuperAdminBaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      logger.error(`${this.model.name} findById error:`, { error: error.message });
      throw error;
    }
  }

  async findAll(filters = {}, options = {}) {
    try {
      const where = { ...filters };
      return await this.model.findAll({ where, ...options });
    } catch (error) {
      logger.error(`${this.model.name} findAll error:`, { error: error.message });
      throw error;
    }
  }

  async findAndCountAll({ page = 1, limit = 20, filters = {}, order = [['created_at', 'DESC']], include = [], attributes = null } = {}) {
    try {
      const where = { ...filters };
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

  async create(data, options = {}) {
    try {
      return await this.model.create(data, options);
    } catch (error) {
      logger.error(`${this.model.name} create error:`, { error: error.message });
      throw error;
    }
  }

  async update(id, data, options = {}) {
    try {
      const instance = await this.findById(id);
      if (!instance) return null;
      await instance.update(data, options);
      return instance;
    } catch (error) {
      logger.error(`${this.model.name} update error:`, { error: error.message });
      throw error;
    }
  }

  async delete(id, options = {}) {
    try {
      const instance = await this.findById(id);
      if (!instance) return false;
      await instance.destroy(options);
      return true;
    } catch (error) {
      logger.error(`${this.model.name} delete error:`, { error: error.message });
      throw error;
    }
  }

  async findOne(filters = {}, options = {}) {
    try {
      return await this.model.findOne({ where: filters, ...options });
    } catch (error) {
      logger.error(`${this.model.name} findOne error:`, { error: error.message });
      throw error;
    }
  }
}

module.exports = SuperAdminBaseRepository;
