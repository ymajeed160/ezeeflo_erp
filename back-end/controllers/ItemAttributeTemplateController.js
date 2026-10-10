'use strict';
const itemAttributeTemplateService = require('../services/ItemAttributeTemplateService');
const ApiResponse = require('../utils/apiResponse');

class ItemAttributeTemplateController {
  async getTemplates(req, res, next) {
    try {
      const result = await itemAttributeTemplateService.list(req.user.tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: result.rows,
        pagination: result.pagination,
        message: 'Attribute templates retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getTemplateById(req, res, next) {
    try {
      const tpl = await itemAttributeTemplateService.getById(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { data: tpl, message: 'Attribute template retrieved successfully' });
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req, res, next) {
    try {
      const tpl = await itemAttributeTemplateService.create(req.body, req.user.tenantId, req.user.id);
      return ApiResponse.created(res, { data: tpl, message: 'Attribute template created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req, res, next) {
    try {
      const tpl = await itemAttributeTemplateService.update(req.params.id, req.body, req.user.tenantId, req.user.id);
      return ApiResponse.success(res, { data: tpl, message: 'Attribute template updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req, res, next) {
    try {
      await itemAttributeTemplateService.remove(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'Attribute template deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItemAttributeTemplateController();
