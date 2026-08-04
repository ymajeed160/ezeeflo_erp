const subscriptionPlanRepository = require('../repositories/SubscriptionPlanRepository');
const { SubscriptionPlanModule } = require('../../models');
const logger = require('../../utils/logger');

class SubscriptionPlanService {
  async getAllPlans(filters = {}, pagination = {}) {
    return await subscriptionPlanRepository.findAndCountAll({
      ...pagination,
      filters,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });
  }

  async getAllPlansWithModules() {
    return await subscriptionPlanRepository.findAllWithModules();
  }

  async getPlanById(id) {
    const plan = await subscriptionPlanRepository.findByIdWithModules(id);
    if (!plan) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Subscription plan not found', 404);
    }
    return plan;
  }

  async createPlan(data) {
    const existing = await subscriptionPlanRepository.findByCode(data.planCode);
    if (existing) {
      const { AppError } = require('../../utils/appError');
      throw new AppError(`Plan code '${data.planCode}' already exists`, 409);
    }

    const plan = await subscriptionPlanRepository.create(data);

    // Link modules if provided
    if (data.moduleIds && Array.isArray(data.moduleIds)) {
      const planModules = data.moduleIds.map(moduleId => ({
        planId: plan.id,
        moduleId,
        isDefault: true,
      }));
      await SubscriptionPlanModule.bulkCreate(planModules);
    }

    return await subscriptionPlanRepository.findByIdWithModules(plan.id);
  }

  async updatePlan(id, data) {
    const plan = await subscriptionPlanRepository.findById(id);
    if (!plan) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Subscription plan not found', 404);
    }

    if (data.planCode && data.planCode !== plan.planCode) {
      const existing = await subscriptionPlanRepository.findByCode(data.planCode);
      if (existing) {
        const { AppError } = require('../../utils/appError');
        throw new AppError(`Plan code '${data.planCode}' already exists`, 409);
      }
    }

    await subscriptionPlanRepository.update(id, data);

    // Update module links if provided
    if (data.moduleIds && Array.isArray(data.moduleIds)) {
      await SubscriptionPlanModule.destroy({ where: { planId: id } });
      const planModules = data.moduleIds.map(moduleId => ({
        planId: id,
        moduleId,
        isDefault: true,
      }));
      await SubscriptionPlanModule.bulkCreate(planModules);

      // Sync all active/trial subscriptions that use this plan
      try {
        const { CompanySubscription, CompanySubscriptionModule, SubscriptionModule } = require('../../models');
        const { Op } = require('sequelize');
        const { v4: uuidv4 } = require('uuid');

        const subscriptions = await CompanySubscription.findAll({
          where: { planId: id, status: { [Op.in]: ['active', 'trial'] } },
        });

        for (const sub of subscriptions) {
          // Get existing company subscription modules
          const existingModules = await CompanySubscriptionModule.findAll({
            where: { subscriptionId: sub.id },
          });

          const existingMap = {};
          for (const em of existingModules) {
            existingMap[em.moduleId] = em;
          }

          for (const moduleId of data.moduleIds) {
            if (existingMap[moduleId]) {
              // Module exists — enable it if disabled
              if (!existingMap[moduleId].isEnabled) {
                await existingMap[moduleId].update({ isEnabled: true });
              }
            } else {
              // Module doesn't exist — create it enabled
              await CompanySubscriptionModule.create({
                id: uuidv4(),
                subscriptionId: sub.id,
                moduleId,
                isEnabled: true,
              });
            }
            delete existingMap[moduleId];
          }

          // Remaining modules in existingMap are no longer in the plan — disable them
          for (const moduleId in existingMap) {
            if (existingMap[moduleId].isEnabled) {
              await existingMap[moduleId].update({ isEnabled: false });
            }
          }
        }
      } catch (syncErr) {
        logger.warn('Failed to sync subscription modules for plan update:', syncErr.message);
      }
    }

    return await subscriptionPlanRepository.findByIdWithModules(id);
  }

  async deletePlan(id) {
    const plan = await subscriptionPlanRepository.findById(id);
    if (!plan) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Subscription plan not found', 404);
    }

    // Check if any active subscriptions use this plan
    const { CompanySubscription } = require('../../models');
    const activeSubscriptions = await CompanySubscription.findOne({
      where: { planId: id, status: ['active', 'trial'] },
    });

    if (activeSubscriptions) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Cannot delete plan with active subscriptions. Deactivate it instead.', 400);
    }

    await SubscriptionPlanModule.destroy({ where: { planId: id } });
    await subscriptionPlanRepository.delete(id);
    return true;
  }

  async togglePlanStatus(id) {
    const plan = await subscriptionPlanRepository.findById(id);
    if (!plan) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Subscription plan not found', 404);
    }
    return await subscriptionPlanRepository.update(id, { isActive: !plan.isActive });
  }
}

module.exports = new SubscriptionPlanService();
