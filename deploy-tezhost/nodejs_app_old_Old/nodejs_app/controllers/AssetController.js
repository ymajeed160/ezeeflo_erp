const assetService = require('../services/AssetService');
const AssetDTO = require('../dto/AssetDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetController {
  async getAssets(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await assetService.getAssets(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: AssetDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Assets retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAssetById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const asset = await assetService.getAssetById(req.params.id, tenantId);
      return ApiResponse.success(res, {
        data: AssetDTO.toResponse(asset),
        message: 'Asset retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveAssets(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const assets = await assetService.getActiveAssets(tenantId);
      return ApiResponse.success(res, {
        data: AssetDTO.toCompactListResponse(assets),
        message: 'Active assets retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getNextAssetCode(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const nextCode = await assetService.getNextAssetCode(tenantId);
      return ApiResponse.success(res, {
        data: { nextAssetCode: nextCode },
        message: 'Next asset code retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createAsset(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const asset = await assetService.createAsset(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: AssetDTO.toResponse(asset),
        message: 'Asset created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAsset(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const asset = await assetService.updateAsset(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetDTO.toResponse(asset),
        message: 'Asset updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAssetStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const { status } = req.body;
      const asset = await assetService.updateStatus(req.params.id, status, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetDTO.toResponse(asset),
        message: `Asset status changed to "${status}" successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAsset(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await assetService.deleteAsset(req.params.id, tenantId);
      return ApiResponse.success(res, {
        message: 'Asset deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetController();
