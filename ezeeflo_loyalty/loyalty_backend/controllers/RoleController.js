const roleService = require('../services/RoleService');
const ApiResponse = require('../utils/apiResponse');

class RoleController {
  async getAll(req, res, next) {
    try {
      const result = await roleService.getAll(req.user.companyId, req.query);
      return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const role = await roleService.getById(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { data: role });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const role = await roleService.create(req.body, req.user.companyId);
      return ApiResponse.created(res, { data: role, message: 'Role created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const role = await roleService.update(req.params.id, req.body, req.user.companyId);
      return ApiResponse.success(res, { data: role, message: 'Role updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await roleService.delete(req.params.id, req.user.companyId);
      return ApiResponse.success(res, { message: 'Role deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async assignPermissions(req, res, next) {
    try {
      const role = await roleService.assignPermissions(req.params.id, req.body.permissionIds, req.user.companyId);
      return ApiResponse.success(res, { data: role, message: 'Permissions assigned successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoleController();
