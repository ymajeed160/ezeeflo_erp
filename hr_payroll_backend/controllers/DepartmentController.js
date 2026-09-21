const service = require('../services/DepartmentService');
const ApiResponse = require('../utils/apiResponse');

class DepartmentController {
  async getAll(req, res, next) { try { const r = await service.getAll(req.tenantId, req.query); return ApiResponse.paginated(res, { data: r.data, pagination: r.pagination }); } catch (e) { next(e); } }
  async getById(req, res, next) { try { const d = await service.getById(req.params.id, req.tenantId); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } }
  async create(req, res, next) { try { const d = await service.create(req.body, req.tenantId, req.userId, req.headers.authorization); return ApiResponse.created(res, { data: d }); } catch (e) { next(e); } }
  async update(req, res, next) { try { const d = await service.update(req.params.id, req.body, req.tenantId, req.userId, req.headers.authorization); return ApiResponse.success(res, { data: d }); } catch (e) { next(e); } }
  async delete(req, res, next) { try { const r = await service.delete(req.params.id, req.tenantId, req.userId, req.headers.authorization); return ApiResponse.success(res, { data: r }); } catch (e) { next(e); } }
}

module.exports = new DepartmentController();
