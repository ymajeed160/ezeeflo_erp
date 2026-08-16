const svc = require('../services/AssetMaintenanceService');
const DTO = require('../dto/AssetMaintenanceDTO');
const ApiResponse = require('../utils/apiResponse');

class AssetMaintenanceController {
  async getMaintenances(req, res, next) {
    try { const r = await svc.getMaintenances(req.user.tenantId, req.query); return ApiResponse.paginated(res, { data: DTO.toListResponse(r.rows), pagination: r.pagination }); } catch (e) { next(e); }
  }
  async getMaintenanceById(req, res, next) {
    try { const m = await svc.getMaintenanceById(req.params.id, req.user.tenantId); return ApiResponse.success(res, { data: DTO.toResponse(m) }); } catch (e) { next(e); }
  }
  async getNextMaintenanceNumber(req, res, next) {
    try { const n = await svc.getNextMaintenanceNumber(req.user.tenantId); return ApiResponse.success(res, { data: { nextMaintenanceNumber: n } }); } catch (e) { next(e); }
  }
  async getDueReminders(req, res, next) {
    try { const days = parseInt(req.query.days) || 30; const reminders = await svc.getDueReminders(req.user.tenantId, days); return ApiResponse.success(res, { data: DTO.toListResponse(reminders) }); } catch (e) { next(e); }
  }
  async createMaintenance(req, res, next) {
    try { const m = await svc.createMaintenance(req.body, req.user.tenantId, req.user.id); return ApiResponse.created(res, { data: DTO.toResponse(m), message: 'Maintenance created' }); } catch (e) { next(e); }
  }
  async updateMaintenance(req, res, next) {
    try { const m = await svc.updateMaintenance(req.params.id, req.body, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: DTO.toResponse(m), message: 'Maintenance updated' }); } catch (e) { next(e); }
  }
  async deleteMaintenance(req, res, next) {
    try { await svc.deleteMaintenance(req.params.id, req.user.tenantId); return ApiResponse.success(res, { message: 'Maintenance deleted' }); } catch (e) { next(e); }
  }
}

module.exports = new AssetMaintenanceController();
