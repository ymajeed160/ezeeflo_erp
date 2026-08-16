const assetCustodianService = require('../services/AssetCustodianService');
const AssetCustodianDTO = require('../dto/AssetCustodianDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetCustodianController {
  async getCustodians(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await assetCustodianService.getCustodians(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: AssetCustodianDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Asset custodians retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustodianById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const custodian = await assetCustodianService.getCustodianById(req.params.id, tenantId);
      return ApiResponse.success(res, {
        data: AssetCustodianDTO.toResponse(custodian),
        message: 'Asset custodian retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveCustodians(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const custodians = await assetCustodianService.getActiveCustodians(tenantId);
      return ApiResponse.success(res, {
        data: AssetCustodianDTO.toCompactListResponse(custodians),
        message: 'Active asset custodians retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createCustodian(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const custodian = await assetCustodianService.createCustodian(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: AssetCustodianDTO.toResponse(custodian),
        message: 'Asset custodian created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCustodian(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const custodian = await assetCustodianService.updateCustodian(req.params.id, req.body, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetCustodianDTO.toResponse(custodian),
        message: 'Asset custodian updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleCustodianStatus(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const custodian = await assetCustodianService.toggleStatus(req.params.id, tenantId, userId);
      return ApiResponse.success(res, {
        data: AssetCustodianDTO.toResponse(custodian),
        message: `Asset custodian ${custodian.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCustodian(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await assetCustodianService.deleteCustodian(req.params.id, tenantId);
      return ApiResponse.success(res, {
        message: 'Asset custodian deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetCustodianController();
