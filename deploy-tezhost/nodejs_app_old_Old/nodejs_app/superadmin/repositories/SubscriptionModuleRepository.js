const SuperAdminBaseRepository = require('./SuperAdminBaseRepository');
const { SubscriptionModule } = require('../../models');
const logger = require('../../utils/logger');

class SubscriptionModuleRepository extends SuperAdminBaseRepository {
  constructor() {
    super(SubscriptionModule);
  }

  async findByCode(moduleCode) {
    try {
      return await this.model.findOne({ where: { moduleCode } });
    } catch (error) {
      logger.error('SubscriptionModuleRepository findByCode error:', { error: error.message });
      throw error;
    }
  }

  async findAllActive() {
    try {
      return await this.model.findAll({
        where: { status: ['enabled', 'beta'] },
        order: [['sortOrder', 'ASC']],
      });
    } catch (error) {
      logger.error('SubscriptionModuleRepository findAllActive error:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new SubscriptionModuleRepository();
