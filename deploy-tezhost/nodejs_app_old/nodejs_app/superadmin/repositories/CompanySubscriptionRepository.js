const SuperAdminBaseRepository = require('./SuperAdminBaseRepository');
const { CompanySubscription, CompanySubscriptionModule, SubscriptionPlan, SubscriptionModule, Tenant } = require('../../models');
const logger = require('../../utils/logger');

class CompanySubscriptionRepository extends SuperAdminBaseRepository {
  constructor() {
    super(CompanySubscription);
  }

  async findByCompanyId(companyId) {
    try {
      return await this.model.findOne({
        where: { companyId },
        include: [
          {
            model: SubscriptionPlan,
            as: 'plan',
          },
          {
            model: CompanySubscriptionModule,
            as: 'enabledModules',
            include: [{
              model: SubscriptionModule,
              as: 'module',
            }],
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      logger.error('CompanySubscriptionRepository findByCompanyId error:', { error: error.message });
      throw error;
    }
  }

  async findByIdWithDetails(id) {
    try {
      return await this.model.findByPk(id, {
        include: [
          {
            model: SubscriptionPlan,
            as: 'plan',
          },
          {
            model: Tenant,
            as: 'company',
          },
          {
            model: CompanySubscriptionModule,
            as: 'enabledModules',
            include: [{
              model: SubscriptionModule,
              as: 'module',
            }],
          },
        ],
      });
    } catch (error) {
      logger.error('CompanySubscriptionRepository findByIdWithDetails error:', { error: error.message });
      throw error;
    }
  }

  async findActiveByCompanyId(companyId) {
    try {
      return await this.model.findOne({
        where: {
          companyId,
          status: ['active', 'trial'],
        },
        include: [
          {
            model: SubscriptionPlan,
            as: 'plan',
          },
          {
            model: CompanySubscriptionModule,
            as: 'enabledModules',
            include: [{
              model: SubscriptionModule,
              as: 'module',
            }],
          },
        ],
      });
    } catch (error) {
      logger.error('CompanySubscriptionRepository findActiveByCompanyId error:', { error: error.message });
      throw error;
    }
  }

  async findAllWithDetails({ page = 1, limit = 20, filters = {}, order = [['createdAt', 'DESC']] } = {}) {
    try {
      const where = { ...filters };
      const offset = (page - 1) * limit;

      const result = await this.model.findAndCountAll({
        where,
        limit,
        offset,
        order,
        include: [
          {
            model: SubscriptionPlan,
            as: 'plan',
          },
          {
            model: Tenant,
            as: 'company',
            attributes: ['id', 'name', 'subdomain', 'email', 'isActive'],
          },
          {
            model: CompanySubscriptionModule,
            as: 'enabledModules',
            include: [{
              model: SubscriptionModule,
              as: 'module',
            }],
          },
        ],
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
    } catch (error) {
      logger.error('CompanySubscriptionRepository findAllWithDetails error:', { error: error.message });
      throw error;
    }
  }

  async countByStatus(status) {
    try {
      return await this.model.count({ where: { status } });
    } catch (error) {
      logger.error('CompanySubscriptionRepository countByStatus error:', { error: error.message });
      throw error;
    }
  }

  async countActive() {
    try {
      return await this.model.count({
        where: { status: ['active', 'trial'] },
      });
    } catch (error) {
      logger.error('CompanySubscriptionRepository countActive error:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new CompanySubscriptionRepository();
