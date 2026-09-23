const sellingResourceService = require('../services/SellingResourceService');
const ApiResponse = require('../utils/apiResponse');

class SellingResourceController {
  async getAll(req, res, next) {
    try {
      const { tenantId } = req.user;
      const result = await sellingResourceService.getAll(tenantId, req.query);
      return ApiResponse.success(res, { ...result, message: 'Selling resources retrieved successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getForSelect(req, res, next) {
    try {
      const { tenantId } = req.user;
      const data = await sellingResourceService.getForSelect(tenantId, req.query.search);
      return ApiResponse.success(res, { data, message: 'Selling resources retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const resource = await sellingResourceService.getById(id, tenantId);
      return ApiResponse.success(res, { data: resource, message: 'Selling resource retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const resource = await sellingResourceService.create(req.body, tenantId, userId);
      return ApiResponse.created(res, { data: resource, message: 'Selling resource created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const resource = await sellingResourceService.update(id, req.body, tenantId, userId);
      return ApiResponse.success(res, { data: resource, message: 'Selling resource updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const result = await sellingResourceService.delete(id, tenantId, userId);
      return ApiResponse.success(res, { ...result, message: 'Selling resource deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const resource = await sellingResourceService.toggleStatus(id, tenantId, userId);
      return ApiResponse.success(res, { data: resource, message: 'Selling resource status updated' });
    } catch (error) {
      next(error);
    }
  }

  // ============================================================
  // Resource Types
  // ============================================================

  async getAllTypes(req, res, next) {
    try {
      const { tenantId } = req.user;
      const result = await sellingResourceService.getAllTypes(tenantId, req.query);
      return ApiResponse.success(res, { ...result, message: 'Resource types retrieved successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getTypeById(req, res, next) {
    try {
      const { tenantId } = req.user;
      const { id } = req.params;
      const type = await sellingResourceService.getTypeById(id, tenantId);
      return ApiResponse.success(res, { data: type, message: 'Resource type retrieved' });
    } catch (error) {
      next(error);
    }
  }

  async createType(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const type = await sellingResourceService.createType(req.body, tenantId, userId);
      return ApiResponse.created(res, { data: type, message: 'Resource type created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateType(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const type = await sellingResourceService.updateType(id, req.body, tenantId, userId);
      return ApiResponse.success(res, { data: type, message: 'Resource type updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteType(req, res, next) {
    try {
      const { tenantId, id: userId } = req.user;
      const { id } = req.params;
      const result = await sellingResourceService.deleteType(id, tenantId, userId);
      return ApiResponse.success(res, { ...result, message: 'Resource type deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SellingResourceController();
