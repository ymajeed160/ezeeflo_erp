const customerService = require('../services/CustomerService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class CustomerController {
  async getAll(req, res, next) {
    try {
      const { tenantId } = req.user;
      const result = await customerService.getAll(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: result.data,
        pagination: result.pagination,
        message: 'Customers retrieved successfully',
      });
    } catch (error) {
      logger.error('CustomerController.getAll:', error);
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { tenantId } = req.user;
      const customer = await customerService.getById(req.params.id, tenantId);
      return ApiResponse.success(res, { data: customer, message: 'Customer retrieved successfully' });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const customer = await customerService.create(req.body, tenantId, userId);
      return ApiResponse.created(res, { data: customer, message: 'Customer created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const customer = await customerService.update(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, { data: customer, message: 'Customer updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const result = await customerService.delete(req.params.id, tenantId, userId);
      return ApiResponse.success(res, { data: result, message: 'Customer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const customer = await customerService.toggleStatus(req.params.id, tenantId, userId);
      return ApiResponse.success(res, { data: customer, message: 'Customer status updated' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();