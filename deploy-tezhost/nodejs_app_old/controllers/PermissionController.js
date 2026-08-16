const permissionService = require('../services/PermissionService');
const ApiResponse = require('../utils/apiResponse');

class PermissionController {
  async getAll(req, res, next) {
    try {
      const result = await permissionService.getAllPermissions(req.user.tenantId, req.query);
      return ApiResponse.success(res, { data: result.permissions });
    } catch (error) { next(error); }
  }

  async getByModule(req, res, next) {
    try {
      const permissions = await permissionService.getPermissionsByModule(req.params.module, req.user.tenantId);
      return ApiResponse.success(res, { data: permissions });
    } catch (error) { next(error); }
  }

  async getModules(req, res, next) {
    try {
      const modules = await permissionService.getModuleList(req.user.tenantId);
      return ApiResponse.success(res, { data: modules });
    } catch (error) { next(error); }
  }
}

module.exports = new PermissionController();