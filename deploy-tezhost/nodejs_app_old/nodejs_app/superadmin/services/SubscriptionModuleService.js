const subscriptionModuleRepository = require('../repositories/SubscriptionModuleRepository');
const logger = require('../../utils/logger');

class SubscriptionModuleService {
  async getAllModules(filters = {}, pagination = {}) {
    return await subscriptionModuleRepository.findAndCountAll({
      ...pagination,
      filters,
      order: [['sortOrder', 'ASC'], ['moduleName', 'ASC']],
    });
  }

  async getAllActiveModules() {
    return await subscriptionModuleRepository.findAllActive();
  }

  async getModuleById(id) {
    const mod = await subscriptionModuleRepository.findById(id);
    if (!mod) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Module not found', 404);
    }
    return mod;
  }

  async createModule(data) {
    const existing = await subscriptionModuleRepository.findByCode(data.moduleCode);
    if (existing) {
      const { AppError } = require('../../utils/appError');
      throw new AppError(`Module code '${data.moduleCode}' already exists`, 409);
    }
    return await subscriptionModuleRepository.create(data);
  }

  async updateModule(id, data) {
    const mod = await subscriptionModuleRepository.findById(id);
    if (!mod) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Module not found', 404);
    }
    if (data.moduleCode && data.moduleCode !== mod.moduleCode) {
      const existing = await subscriptionModuleRepository.findByCode(data.moduleCode);
      if (existing) {
        const { AppError } = require('../../utils/appError');
        throw new AppError(`Module code '${data.moduleCode}' already exists`, 409);
      }
    }
    return await subscriptionModuleRepository.update(id, data);
  }

  async deleteModule(id) {
    const mod = await subscriptionModuleRepository.findById(id);
    if (!mod) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Module not found', 404);
    }
    // Check if module is linked to any plans
    const { SubscriptionPlanModule } = require('../../models');
    const linkedPlans = await SubscriptionPlanModule.findOne({ where: { moduleId: id } });
    if (linkedPlans) {
      const { AppError } = require('../../utils/appError');
      throw new AppError('Cannot delete module linked to subscription plans. Disable it instead.', 400);
    }
    return await subscriptionModuleRepository.delete(id);
  }
}

module.exports = new SubscriptionModuleService();
