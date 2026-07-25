const assetCategoryService = require('../services/AssetCategoryService');
const AssetCategoryDTO = require('../dto/AssetCategoryDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetCategoryController {
  async getAssetCategories(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await assetCategoryService.getAssetCategories(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: AssetCategoryDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Asset categories retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAssetCategoryById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const category = await assetCategoryService.getAssetCategoryById(req.params.id, tenantId);
      return ApiResponse.success(res, {
        data: AssetCategoryDTO.toResponse(category),
        message: 'Asset category retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveAssetCategories(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const categories = await assetCategoryService.getActiveAssetCategories(tenantId);
      return ApiResponse.success(res, {
        data: AssetCategoryDTO.toCompactListResponse(categories),
        message: 'Active asset categories retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createAssetCategory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const category = await assetCategoryService.createAssetCategory(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: AssetCategoryDTO.toResponse(category),
        message: 'Asset category created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAssetCategory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const category = await assetCategoryService.updateAssetCategory(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetCategoryDTO.toResponse(category),
        message: 'Asset category updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleAssetCategoryStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const category = await assetCategoryService.toggleStatus(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetCategoryDTO.toResponse(category),
        message: `Asset category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAssetCategory(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await assetCategoryService.deleteAssetCategory(req.params.id, tenantId);
      return ApiResponse.success(res, {
        message: 'Asset category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetCategoryController();
