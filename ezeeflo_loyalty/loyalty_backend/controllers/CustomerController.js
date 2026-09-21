const customerService = require('../services/CustomerService');
const ApiResponse = require('../utils/apiResponse');

class CustomerController {
  async getAll(req, res, next) {
    try {
      const result = await customerService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const customer = await customerService.getById(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: customer });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const customer = await customerService.create(req.body, req.user.companyId, req.user.id);
      return ApiResponse.created(res, { data: customer, message: 'Customer created with loyalty account' });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const customer = await customerService.update(req.params.id, req.body, req.user.companyId, req.user.id);
      return ApiResponse.success(res, { data: customer, message: 'Customer updated' });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await customerService.delete(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { message: 'Customer deleted' });
    } catch (error) { next(error); }
  }

  async toggleStatus(req, res, next) {
    try {
      const customer = await customerService.toggleStatus(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: customer, message: `Customer ${customer.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) { next(error); }
  }

  async merge(req, res, next) {
    try {
      const { primaryId, secondaryId } = req.body;
      const result = await customerService.mergeCustomers(primaryId, secondaryId, req.user.companyId);
      return ApiResponse.success(res, { data: result, message: 'Customers merged successfully' });
    } catch (error) { next(error); }
  }

  async getSegments(req, res, next) {
    try {
      const segments = await customerService.getSegments(req.user.companyId);
      return ApiResponse.success(res, { data: segments });
    } catch (error) { next(error); }
  }

  async getTags(req, res, next) {
    try {
      const tags = await customerService.getAllTags(req.user.companyId);
      return ApiResponse.success(res, { data: tags });
    } catch (error) { next(error); }
  }

  async getWallet(req, res, next) {
    try {
      const wallet = await customerService.getCustomerWallet(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: wallet });
    } catch (error) { next(error); }
  }
}

module.exports = new CustomerController();
