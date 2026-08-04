const deprService = require('../services/AssetDepreciationService');
const AssetDepreciationDTO = require('../dto/AssetDepreciationDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetDepreciationController {
  async getDepreciations(req, res, next) {
    try { const r = await deprService.getDepreciations(req.user.tenantId, req.query); return ApiResponse.paginated(res, { data: AssetDepreciationDTO.toListResponse(r.rows), pagination: r.pagination, message: 'Depreciations retrieved' }); } catch (e) { next(e); }
  }
  async getDepreciationById(req, res, next) {
    try { const d = await deprService.getDepreciationById(req.params.id, req.user.tenantId); return ApiResponse.success(res, { data: AssetDepreciationDTO.toResponse(d), message: 'Depreciation retrieved' }); } catch (e) { next(e); }
  }
  async getNextDepreciationNumber(req, res, next) {
    try { const n = await deprService.getNextDepreciationNumber(req.user.tenantId); return ApiResponse.success(res, { data: { nextDepreciationNumber: n }, message: 'Next number retrieved' }); } catch (e) { next(e); }
  }
  async previewDepreciation(req, res, next) {
    try { const { assetId, frequency } = req.body; const preview = await deprService.previewDepreciation(assetId, req.user.tenantId, { frequency }); return ApiResponse.success(res, { data: AssetDepreciationDTO.toPreviewResponse(preview), message: 'Depreciation preview calculated' }); } catch (e) { next(e); }
  }
  async postDepreciation(req, res, next) {
    try { const d = await deprService.postDepreciation(req.body, req.user.tenantId, req.user.id); return ApiResponse.created(res, { data: AssetDepreciationDTO.toResponse(d), message: 'Depreciation posted successfully' }); } catch (e) { next(e); }
  }
  async reverseDepreciation(req, res, next) {
    try { const d = await deprService.reverseDepreciation(req.params.id, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: AssetDepreciationDTO.toResponse(d), message: 'Depreciation reversed successfully' }); } catch (e) { next(e); }
  }
  async deleteDepreciation(req, res, next) {
    try { await deprService.deleteDepreciation(req.params.id, req.user.tenantId); return ApiResponse.success(res, { message: 'Depreciation deleted' }); } catch (e) { next(e); }
  }
}

module.exports = new AssetDepreciationController();
