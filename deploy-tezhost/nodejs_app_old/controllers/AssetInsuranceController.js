const svc = require('../services/AssetInsuranceService');
const DTO = require('../dto/AssetInsuranceDTO');
const ApiResponse = require('../utils/apiResponse');
class AssetInsuranceController {
  async getAll(req, res, next) { try { const r = await svc.getAll(req.user.tenantId, req.query); return ApiResponse.paginated(res, { data: DTO.toListResponse(r.rows), pagination: r.pagination }); } catch (e) { next(e); } }
  async getById(req, res, next) { try { const r = await svc.getById(req.params.id, req.user.tenantId); return ApiResponse.success(res, { data: DTO.toResponse(r) }); } catch (e) { next(e); } }
  async getNextNumber(req, res, next) { try { const n = await svc.getNextNumber(req.user.tenantId); return ApiResponse.success(res, { data: { nextInsuranceNumber: n } }); } catch (e) { next(e); } }
  async getExpiring(req, res, next) { try { const days = parseInt(req.query.days) || 30; const r = await svc.getExpiring(req.user.tenantId, days); return ApiResponse.success(res, { data: DTO.toListResponse(r) }); } catch (e) { next(e); } }
  async create(req, res, next) { try { const r = await svc.create(req.body, req.user.tenantId, req.user.id); return ApiResponse.created(res, { data: DTO.toResponse(r), message: 'Insurance created' }); } catch (e) { next(e); } }
  async update(req, res, next) { try { const r = await svc.update(req.params.id, req.body, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: DTO.toResponse(r), message: 'Insurance updated' }); } catch (e) { next(e); } }
  async delete(req, res, next) { try { await svc.delete(req.params.id, req.user.tenantId); return ApiResponse.success(res, { message: 'Insurance deleted' }); } catch (e) { next(e); } }
}
module.exports = new AssetInsuranceController();
