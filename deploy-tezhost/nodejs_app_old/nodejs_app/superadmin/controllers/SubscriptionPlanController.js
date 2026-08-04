const subscriptionPlanService = require('../services/SubscriptionPlanService');
const ApiResponse = require('../../utils/apiResponse');
const { StatusCodes } = require('http-status-codes');

class SubscriptionPlanController {
  async getAll(req, res, next) {
    try {
      const { page, limit, isActive, companyId, ...filters } = req.query;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const result = await subscriptionPlanService.getAllPlans(filters, { page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getAllWithModules(req, res, next) {
    try {
      const plans = await subscriptionPlanService.getAllPlansWithModules();
      return ApiResponse.success(res, { data: plans });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const plan = await subscriptionPlanService.getPlanById(req.params.id);
      return ApiResponse.success(res, { data: plan });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const plan = await subscriptionPlanService.createPlan({
        ...req.body,
        createdBy: req.user.id,
      });
      return ApiResponse.created(res, { data: plan, message: 'Subscription plan created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const plan = await subscriptionPlanService.updatePlan(req.params.id, {
        ...req.body,
        updatedBy: req.user.id,
      });
      return ApiResponse.success(res, { data: plan, message: 'Subscription plan updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await subscriptionPlanService.deletePlan(req.params.id);
      return ApiResponse.success(res, { message: 'Subscription plan deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const plan = await subscriptionPlanService.togglePlanStatus(req.params.id);
      return ApiResponse.success(res, { data: plan, message: `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionPlanController();
