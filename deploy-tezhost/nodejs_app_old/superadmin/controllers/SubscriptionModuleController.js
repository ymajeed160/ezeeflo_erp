const subscriptionModuleService = require('../services/SubscriptionModuleService');
const ApiResponse = require('../../utils/apiResponse');

class SubscriptionModuleController {
  async getAll(req, res, next) {
    try {
      const { page, limit, status, companyId, ...filters } = req.query;
      if (status) filters.status = status;

      const result = await subscriptionModuleService.getAllModules(filters, { page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getAllActive(req, res, next) {
    try {
      const modules = await subscriptionModuleService.getAllActiveModules();
      return ApiResponse.success(res, { data: modules });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const mod = await subscriptionModuleService.getModuleById(req.params.id);
      return ApiResponse.success(res, { data: mod });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const mod = await subscriptionModuleService.createModule({
        ...req.body,
        createdBy: req.user.id,
      });
      return ApiResponse.created(res, { data: mod, message: 'Module created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const mod = await subscriptionModuleService.updateModule(req.params.id, {
        ...req.body,
        updatedBy: req.user.id,
      });
      return ApiResponse.success(res, { data: mod, message: 'Module updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await subscriptionModuleService.deleteModule(req.params.id);
      return ApiResponse.success(res, { message: 'Module deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionModuleController();
