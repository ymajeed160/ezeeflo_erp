const assetLocationService = require('../services/AssetLocationService');
const AssetLocationDTO = require('../dto/AssetLocationDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetLocationController {
  async getLocations(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await assetLocationService.getLocations(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: AssetLocationDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Asset locations retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getLocationById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const location = await assetLocationService.getLocationById(req.params.id, tenantId);
      return ApiResponse.success(res, {
        data: AssetLocationDTO.toResponse(location),
        message: 'Asset location retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveLocations(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const locations = await assetLocationService.getActiveLocations(tenantId);
      return ApiResponse.success(res, {
        data: AssetLocationDTO.toCompactListResponse(locations),
        message: 'Active asset locations retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createLocation(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const location = await assetLocationService.createLocation(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: AssetLocationDTO.toResponse(location),
        message: 'Asset location created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const location = await assetLocationService.updateLocation(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetLocationDTO.toResponse(location),
        message: 'Asset location updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleLocationStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const location = await assetLocationService.toggleStatus(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetLocationDTO.toResponse(location),
        message: `Asset location ${location.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLocation(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await assetLocationService.deleteLocation(req.params.id, tenantId);
      return ApiResponse.success(res, {
        message: 'Asset location deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetLocationController();
