const supplierService = require('../services/SupplierService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class SupplierController {
  async getAll(req, res, next) {
    try {
      const { tenantId } = req.user;
      const result = await supplierService.getAll(tenantId, req.query);
      return ApiResponse.success(res, { ...result, message: 'Suppliers retrieved successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const supplier = await supplierService.getById(id, tenantId);
      return ApiResponse.success(res, { data: supplier, message: 'Supplier retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const supplier = await supplierService.create(req.body, tenantId, userId);
      return ApiResponse.created(res, { data: supplier, message: 'Supplier created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const supplier = await supplierService.update(id, req.body, tenantId, userId);
      return ApiResponse.success(res, { data: supplier, message: 'Supplier updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const result = await supplierService.delete(id, tenantId, userId);
      return ApiResponse.success(res, { ...result, message: 'Supplier deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const supplier = await supplierService.toggleStatus(id, tenantId, userId);
      return ApiResponse.success(res, { data: supplier, message: 'Supplier status toggled' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SupplierController();