const SuperAdminBaseRepository = require('./SuperAdminBaseRepository');
const { SubscriptionPlan, SubscriptionPlanModule, SubscriptionModule } = require('../../models');
const logger = require('../../utils/logger');

class SubscriptionPlanRepository extends SuperAdminBaseRepository {
  constructor() {
    super(SubscriptionPlan);
  }

  async findByCode(planCode) {
    try {
      return await this.model.findOne({ where: { planCode } });
    } catch (error) {
      logger.error('SubscriptionPlanRepository findByCode error:', { error: error.message });
      throw error;
    }
  }

  async findAllWithModules() {
    try {
      return await this.model.findAll({
        include: [{
          model: SubscriptionPlanModule,
          as: 'planModules',
          include: [{
            model: SubscriptionModule,
            as: 'module',
          }],
        }],
        order: [['sortOrder', 'ASC']],
      });
    } catch (error) {
      logger.error('SubscriptionPlanRepository findAllWithModules error:', { error: error.message });
      throw error;
    }
  }

  async findByIdWithModules(id) {
    try {
      return await this.model.findByPk(id, {
        include: [{
          model: SubscriptionPlanModule,
          as: 'planModules',
          include: [{
            model: SubscriptionModule,
            as: 'module',
          }],
        }],
      });
    } catch (error) {
      logger.error('SubscriptionPlanRepository findByIdWithModules error:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new SubscriptionPlanRepository();
