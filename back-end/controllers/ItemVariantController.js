'use strict';
const itemVariantService = require('../services/ItemVariantService');
const ApiResponse = require('../utils/apiResponse');

class ItemVariantController {
  async listVariants(req, res, next) {
    try {
      const result = await itemVariantService.listByItem(req.params.itemId, req.user.tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: result.rows,
        pagination: result.pagination,
        message: 'Variants retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async searchVariants(req, res, next) {
    try {
      const result = await itemVariantService.search(req.user.tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: result.rows,
        pagination: result.pagination,
        message: 'Variants retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getVariant(req, res, next) {
    try {
      const variant = await itemVariantService.getById(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { data: variant, message: 'Variant retrieved successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getApplicableAttributes(req, res, next) {
    try {
      const result = await itemVariantService.getApplicableAttributes(req.params.itemId, req.user.tenantId);
      return ApiResponse.success(res, {
        data: { item: result.item, attributes: result.attributes },
        message: 'Applicable attributes retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async findOrCreate(req, res, next) {
    try {
      const variant = await itemVariantService.findOrCreate({
        itemId: req.params.itemId,
        attributeValues: req.body.attributeValues,
        prices: { costPrice: req.body.costPrice, sellingPrice: req.body.sellingPrice },
        tenantId: req.user.tenantId,
        userId: req.user.id,
      });
      const statusCode = variant.isNew ? 201 : 200;
      return ApiResponse.success(res, {
        data: variant,
        message: variant.isNew ? 'Variant created successfully' : 'Existing variant reused',
        statusCode,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const variant = await itemVariantService.toggleStatus(req.params.id, req.user.tenantId, req.user.id);
      return ApiResponse.success(res, { data: variant, message: 'Variant status updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async deleteVariant(req, res, next) {
    try {
      await itemVariantService.remove(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'Variant deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ItemVariantController();
