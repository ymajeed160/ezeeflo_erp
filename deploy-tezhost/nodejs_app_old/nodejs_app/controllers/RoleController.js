const roleService = require('../services/RoleService');
const ApiResponse = require('../utils/apiResponse');

class RoleController {
  async getAll(req, res, next) {
    try {
      const result = await roleService.getAllRoles(req.user.tenantId, req.query);
      return ApiResponse.paginated(res, { data: result.roles, pagination: result.pagination });
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const role = await roleService.getRoleById(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { data: role });
    } catch (error) { next(error); }
  }

  async create(req, res, next) {
    try {
      const role = await roleService.createRole(req.body, req.user.tenantId, req.user.id);
      return ApiResponse.created(res, { data: role, message: 'Role created' });
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const role = await roleService.updateRole(req.params.id, req.body, req.user.tenantId, req.user.id);
      return ApiResponse.success(res, { data: role, message: 'Role updated' });
    } catch (error) { next(error); }
  }

  async delete(req, res, next) {
    try {
      await roleService.deleteRole(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { message: 'Role deleted' });
    } catch (error) { next(error); }
  }

  async getPermissions(req, res, next) {
    try {
      const permissions = await roleService.getPermissionsByRole(req.params.id, req.user.tenantId);
      return ApiResponse.success(res, { data: permissions });
    } catch (error) { next(error); }
  }
}

module.exports = new RoleController();