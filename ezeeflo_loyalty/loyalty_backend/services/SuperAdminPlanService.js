const { SubscriptionPlan, SubscriptionModule, SubscriptionPlanModule, CompanySubscription, Company } = require('../models');
const BaseRepository = require('../repositories/BaseRepository');
const { NotFoundError, ConflictError } = require('../utils/appError');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class SuperAdminPlanService {
  async getAll({ page, limit, isActive }) {
    const filters = {};
    if (isActive !== undefined && isActive !== '') filters.isActive = isActive === 'true' || isActive === true;

    const where = { ...filters };
    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);

    const { count, rows } = await SubscriptionPlan.findAndCountAll({
      where,
      include: [
        { model: SubscriptionModule, as: 'modules', through: { attributes: [] }, required: false },
      ],
      limit: parseInt(limit) || 20,
      offset,
      order: [['sortOrder', 'ASC'], ['created_at', 'DESC']],
      distinct: true,
    });

    return {
      rows, count,
      pagination: {
        page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count,
        totalPages: Math.ceil(count / (parseInt(limit) || 20)),
        hasNext: (parseInt(page) || 1) * (parseInt(limit) || 20) < count,
        hasPrev: (parseInt(page) || 1) > 1,
      },
    };
  }

  async getById(id) {
    const plan = await SubscriptionPlan.findByPk(id, {
      include: [{ model: SubscriptionModule, as: 'modules', through: { attributes: [] } }],
    });
    if (!plan) throw new NotFoundError('Plan not found');
    return plan;
  }

  async create(data) {
    const existing = await SubscriptionPlan.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictError('Plan code already exists');

    const plan = await SubscriptionPlan.create({ id: uuidv4(), ...data });

    if (data.moduleIds?.length) {
      const modules = await SubscriptionModule.findAll({ where: { id: data.moduleIds } });
      await plan.setModules(modules);
    }

    return await this.getById(plan.id);
  }

  async update(id, data) {
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) throw new NotFoundError('Plan not found');

    await plan.update(data);

    if (data.moduleIds) {
      const modules = await SubscriptionModule.findAll({ where: { id: data.moduleIds } });
      await plan.setModules(modules);
    }

    return await this.getById(id);
  }

  async delete(id) {
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) throw new NotFoundError('Plan not found');
    await plan.destroy();
  }

  async toggleStatus(id) {
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) throw new NotFoundError('Plan not found');
    plan.isActive = !plan.isActive;
    await plan.save();
    return plan;
  }

  async getModules() {
    return await SubscriptionModule.findAll({
      order: [['category', 'ASC'], ['sortOrder', 'ASC']],
    });
  }

  async createModule(data) {
    const existing = await SubscriptionModule.findOne({ where: { code: data.code } });
    if (existing) throw new ConflictError('Module code already exists');
    return await SubscriptionModule.create({ id: uuidv4(), ...data });
  }

  async updateModule(id, data) {
    const module = await SubscriptionModule.findByPk(id);
    if (!module) throw new NotFoundError('Module not found');
    return await module.update(data);
  }

  async deleteModule(id) {
    const module = await SubscriptionModule.findByPk(id);
    if (!module) throw new NotFoundError('Module not found');
    await module.destroy();
  }

  async getDashboardStats() {
    const [totalPlans, activePlans, totalModules, enabledModules, totalSubscriptions, activeSubscriptions] =
      await Promise.all([
        SubscriptionPlan.count(),
        SubscriptionPlan.count({ where: { isActive: true } }),
        SubscriptionModule.count(),
        SubscriptionModule.count({ where: { status: 'enabled' } }),
        CompanySubscription.count(),
        CompanySubscription.count({ where: { status: 'active' } }),
      ]);

    return { totalPlans, activePlans, totalModules, enabledModules, totalSubscriptions, activeSubscriptions };
  }

  async assignPlanToCompany(companyId, planId, data) {
    const [company, plan] = await Promise.all([
      Company.findByPk(companyId),
      SubscriptionPlan.findByPk(planId),
    ]);
    if (!company) throw new NotFoundError('Company not found');
    if (!plan) throw new NotFoundError('Plan not found');

    const subscription = await CompanySubscription.create({
      id: uuidv4(),
      companyId,
      planId,
      startDate: data.startDate || new Date(),
      endDate: data.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      billingCycle: data.billingCycle || 'monthly',
      status: 'active',
      autoRenew: data.autoRenew !== false,
    });

    // Activate company
    company.status = 'active';
    company.subscriptionStatus = 'active';
    await company.save();

    return subscription;
  }
}

module.exports = new SuperAdminPlanService();
