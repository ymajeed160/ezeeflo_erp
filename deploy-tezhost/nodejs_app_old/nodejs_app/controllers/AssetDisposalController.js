const svc = require('../services/AssetDisposalService');
const DTO = require('../dto/AssetDisposalDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetDisposalController {
  async getDisposals(req, res, next) {
    try { const r = await svc.getDisposals(req.user.tenantId, req.query); return ApiResponse.paginated(res, { data: DTO.toListResponse(r.rows), pagination: r.pagination }); } catch (e) { next(e); }
  }
  async getDisposalById(req, res, next) {
    try { const d = await svc.getDisposalById(req.params.id, req.user.tenantId); return ApiResponse.success(res, { data: DTO.toResponse(d) }); } catch (e) { next(e); }
  }
  async getNextDisposalNumber(req, res, next) {
    try { const n = await svc.getNextDisposalNumber(req.user.tenantId); return ApiResponse.success(res, { data: { nextDisposalNumber: n } }); } catch (e) { next(e); }
  }
  async createDisposal(req, res, next) {
    try { const d = await svc.createDisposal(req.body, req.user.tenantId, req.user.id); return ApiResponse.created(res, { data: DTO.toResponse(d), message: 'Disposal created' }); } catch (e) { next(e); }
  }
  async postDisposal(req, res, next) {
    try { const d = await svc.postDisposal(req.params.id, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: DTO.toResponse(d), message: 'Disposal posted' }); } catch (e) { next(e); }
  }
  async reverseDisposal(req, res, next) {
    try { const d = await svc.reverseDisposal(req.params.id, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: DTO.toResponse(d), message: 'Disposal reversed' }); } catch (e) { next(e); }
  }
  async deleteDisposal(req, res, next) {
    try { await svc.deleteDisposal(req.params.id, req.user.tenantId); return ApiResponse.success(res, { message: 'Disposal deleted' }); } catch (e) { next(e); }
  }
}

module.exports = new AssetDisposalController();
