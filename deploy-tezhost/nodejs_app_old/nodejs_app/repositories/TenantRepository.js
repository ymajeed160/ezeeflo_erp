const BaseRepository = require('./BaseRepository');
const { Tenant } = require('../models');
const logger = require('../utils/logger');

class TenantRepository extends BaseRepository {
  constructor() {
    super(Tenant);
  }

  async findBySubdomain(subdomain) {
    try {
      return await this.model.findOne({ where: { subdomain } });
    } catch (error) {
      logger.error('TenantRepository findBySubdomain error:', { error: error.message });
      throw error;
    }
  }

  async findByIdWithDetails(id) {
    try {
      return await this.model.findByPk(id);
    } catch (error) {
      logger.error('TenantRepository findByIdWithDetails error:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new TenantRepository();