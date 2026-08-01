const userService = require('../services/UserService');
const ApiResponse = require('../utils/apiResponse');

const userCtrl = {
  getAll: async (req, res, next) => { try { const r = await userService.getAll(req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } },
  getById: async (req, res, next) => { try { const d = await userService.getById(req.params.id); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { const d = await userService.create(req.body, req.userId, req.tenantId); return ApiResponse.created(res, { data: d, message: 'User created' }); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { const d = await userService.update(req.params.id, req.body, req.userId); return ApiResponse.success(res, { data: d, message: 'User updated' }); } catch (e) { next(e); } },
  delete: async (req, res, next) => { try { await userService.delete(req.params.id); return ApiResponse.success(res, { message: 'User deleted' }); } catch (e) { next(e); } },
  lock: async (req, res, next) => { try { await userService.lockUser(req.params.id); return ApiResponse.success(res, { message: 'User locked' }); } catch (e) { next(e); } },
  unlock: async (req, res, next) => { try { await userService.unlockUser(req.params.id); return ApiResponse.success(res, { message: 'User unlocked' }); } catch (e) { next(e); } },
  resetPassword: async (req, res, next) => { try { await userService.resetPassword(req.params.id, req.body.password, req.userId); return ApiResponse.success(res, { message: 'Password reset' }); } catch (e) { next(e); } },
};

module.exports = userCtrl;
