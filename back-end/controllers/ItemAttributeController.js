'use strict';
const itemAttributeService = require('../services/ItemAttributeService');
const ApiResponse = require('../utils/apiResponse');

class ItemAttributeController {
  async getAttributes(req, res, next) {
    try {
      const result = await itemAttributeService.list(req.user.tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: result.rows,
        pagination: result.pagination,
        message: 'Attributes retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttributeById(req, res, next) {
    try {
      const attr = await itemAttributeService.getById(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { data: attr, message: 'Attribute retrieved successfully' });
    } catch (error) {
      next(error);
    }
  }

  async createAttribute(req, res, next) {
    try {
      const attr = await itemAttributeService.create(req.body, req.user.tenantId, req.user.id);
      return ApiResponse.created(res, { data: attr, message: 'Attribute created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateAttribute(req, res, next) {
    try {
      const attr = await itemAttributeService.update(req.params.id, req.body, req.user.tenantId, req.user.id);
      return ApiResponse.success(res, { data: attr, message: 'Attribute updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteAttribute(req, res, next) {
    try {
      await itemAttributeService.remove(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'Attribute deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItemAttributeController();
