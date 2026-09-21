const tenantService = require('../services/TenantService');
const ApiResponse = require('../utils/apiResponse');

class TenantController {
  async getMyTenant(req, res, next) {
    try {
      const tenant = await tenantService.getMyTenant(req.user.tenantId);
      return ApiResponse.success(res, { data: tenant });
    } catch (error) {
      next(error);
    }
  }

  async updateTenant(req, res, next) {
    try {
      const tenant = await tenantService.updateTenant(
        req.user.tenantId,
        req.body,
        req.user.id
      );
      return ApiResponse.success(res, {
        data: tenant,
        message: 'Tenant updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadLogo(req, res, next) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, { message: 'No file uploaded' });
      }
      const tenant = await tenantService.uploadLogo(
        req.user.tenantId,
        req.file,
        req.user.id
      );
      return ApiResponse.success(res, {
        data: tenant,
        message: 'Logo uploaded successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async removeLogo(req, res, next) {
    try {
      const tenant = await tenantService.removeLogo(req.user.tenantId, req.user.id);
      return ApiResponse.success(res, {
        data: tenant,
        message: 'Logo removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TenantController();