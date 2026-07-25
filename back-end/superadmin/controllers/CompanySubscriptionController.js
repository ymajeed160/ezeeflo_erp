const companySubscriptionService = require('../services/CompanySubscriptionService');
const ApiResponse = require('../../utils/apiResponse');

class CompanySubscriptionController {
  async getAll(req, res, next) {
    try {
      const { page, limit, status, companyId, ...filters } = req.query;
      if (status) filters.status = status;
      if (companyId) filters.companyId = companyId;

      const result = await companySubscriptionService.getAllSubscriptions(filters, { page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const sub = await companySubscriptionService.getSubscriptionById(req.params.id);
      return ApiResponse.success(res, { data: sub });
    } catch (error) {
      next(error);
    }
  }

  async getByCompany(req, res, next) {
    try {
      const sub = await companySubscriptionService.getSubscriptionByCompany(req.params.companyId);
      if (!sub) {
        return ApiResponse.success(res, { data: null, message: 'No subscription found for this company' });
      }
      return ApiResponse.success(res, { data: sub });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const sub = await companySubscriptionService.createSubscription({
        ...req.body,
        createdBy: req.user.id,
      });
      return ApiResponse.created(res, { data: sub, message: 'Company subscription created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const sub = await companySubscriptionService.updateSubscription(req.params.id, {
        ...req.body,
        updatedBy: req.user.id,
      });
      return ApiResponse.success(res, { data: sub, message: 'Company subscription updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const sub = await companySubscriptionService.cancelSubscription(req.params.id, {
        reason: req.body.reason,
        updatedBy: req.user.id,
      });
      return ApiResponse.success(res, { data: sub, message: 'Company subscription cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await companySubscriptionService.getDashboardStats();
      return ApiResponse.success(res, { data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CompanySubscriptionController();
