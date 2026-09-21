const svc = require('../services/AssetRevaluationService');
const DTO = require('../dto/AssetRevaluationDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetRevaluationController {
  async getRevaluations(req, res, next) {
    try { const r = await svc.getRevaluations(req.user.tenantId, req.query); return ApiResponse.paginated(res, { data: DTO.toListResponse(r.rows), pagination: r.pagination }); } catch (e) { next(e); }
  }
  async getRevaluationById(req, res, next) {
    try { const r = await svc.getRevaluationById(req.params.id, req.user.tenantId); return ApiResponse.success(res, { data: DTO.toResponse(r) }); } catch (e) { next(e); }
  }
  async getNextRevaluationNumber(req, res, next) {
    try { const n = await svc.getNextRevaluationNumber(req.user.tenantId); return ApiResponse.success(res, { data: { nextRevaluationNumber: n } }); } catch (e) { next(e); }
  }
  async createRevaluation(req, res, next) {
    try { const r = await svc.createRevaluation(req.body, req.user.tenantId, req.user.id); return ApiResponse.created(res, { data: DTO.toResponse(r), message: 'Revaluation created' }); } catch (e) { next(e); }
  }
  async postRevaluation(req, res, next) {
    try { const r = await svc.postRevaluation(req.params.id, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: DTO.toResponse(r), message: 'Revaluation posted' }); } catch (e) { next(e); }
  }
  async deleteRevaluation(req, res, next) {
    try { await svc.deleteRevaluation(req.params.id, req.user.tenantId); return ApiResponse.success(res, { message: 'Revaluation deleted' }); } catch (e) { next(e); }
  }
}

module.exports = new AssetRevaluationController();
