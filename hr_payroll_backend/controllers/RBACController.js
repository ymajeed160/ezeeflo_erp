const { RoleService, PermissionService } = require('../services/RBACService');
const ApiResponse = require('../utils/apiResponse');

const roleCtrl = {
  getAll: async (req, res, next) => { try { const r = await RoleService.getAll(req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await RoleService.getById(req.params.id); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { const d = await RoleService.create(req.body, req.userId); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await RoleService.update(req.params.id, req.body, req.userId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { await RoleService.delete(req.params.id); return ApiResponse.success(res, { message: 'Deleted' }); } catch (e) { next(e); } },
  assignPermissions: async (req, res, next) => { try { const d = await RoleService.assignPermissions(req.params.id, req.body.permissionIds || []); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
};

const permissionCtrl = {
  getAll: async (req, res, next) => { try { const r = await PermissionService.getAll(req.query); return ApiResponse.success(res, { data: r.groups, meta: { total: r.total } }); } catch (e) { next(e); } },
};

module.exports = { roleCtrl, permissionCtrl };
