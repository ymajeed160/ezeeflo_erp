const permissionService = require('../services/PermissionService');
const ApiResponse = require('../utils/apiResponse');

class PermissionController {
  async getAll(req, res, next) {
    try {
      const result = await permissionService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getGroups(req, res, next) {
    try {
      const groups = await permissionService.getGroups(req.user.companyId);
      return ApiResponse.success(res, { data: groups });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const perm = await permissionService.create(req.body, req.user.companyId);
      return ApiResponse.created(res, { data: perm });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const perm = await permissionService.update(req.params.id, req.body, req.user.companyId);
      return ApiResponse.success(res, { data: perm });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await permissionService.delete(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { message: 'Permission deleted' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PermissionController();
