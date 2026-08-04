const assetAuditService = require('../services/AssetAuditService');
const AssetAuditDTO = require('../dto/AssetAuditDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetAuditController {
  async getAudits(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const result = await assetAuditService.getAudits(tenantId, req.query);
      return ApiResponse.paginated(res, {
        data: AssetAuditDTO.toListResponse(result.rows),
        pagination: result.pagination,
        message: 'Asset audits retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditById(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const audit = await assetAuditService.getAuditById(req.params.id, tenantId);
      return ApiResponse.success(res, {
        data: AssetAuditDTO.toResponse(audit),
        message: 'Asset audit retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getNextAuditNumber(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const nextNumber = await assetAuditService.getNextNumber(tenantId);
      return ApiResponse.success(res, {
        data: { nextAuditNumber: nextNumber },
        message: 'Next audit number retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async createAudit(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      const userId = req.user.id;
      const audit = await assetAuditService.createAudit(req.body, tenantId, userId);
      return ApiResponse.created(res, {
        data: AssetAuditDTO.toResponse(audit),
        message: 'Asset audit created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAudit(req, res, next) {
    try {
      const tenantId = req.user.tenantId;
      await assetAuditService.deleteAudit(req.params.id, tenantId);
      return ApiResponse.success(res, {
        message: 'Asset audit deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssetAuditController();
