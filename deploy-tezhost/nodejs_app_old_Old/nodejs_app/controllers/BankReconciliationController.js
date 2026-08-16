const bankReconciliationService = require('../services/BankReconciliationService');
const BankReconciliationDTO = require('../dto/BankReconciliationDTO');
const ApiResponse = require('../utils/apiResponse');

class BankReconciliationController {
  async getReconciliations(req, res, next) {
    try { const r = await bankReconciliationService.getReconciliations(req.user.tenantId, req.query); return ApiResponse.paginated(res, { data: BankReconciliationDTO.toListResponse(r.rows), pagination: r.pagination, message: 'Reconciliations retrieved' }); } catch (e) { next(e); }
  }
  async getReconciliationById(req, res, next) {
    try { const r = await bankReconciliationService.getReconciliationById(req.params.id, req.user.tenantId); return ApiResponse.success(res, { data: BankReconciliationDTO.toResponse(r), message: 'Reconciliation retrieved' }); } catch (e) { next(e); }
  }
  async createReconciliation(req, res, next) {
    try { const r = await bankReconciliationService.createReconciliation(req.body, req.user.tenantId, req.user.id); return ApiResponse.created(res, { data: BankReconciliationDTO.toResponse(r), message: 'Reconciliation created' }); } catch (e) { next(e); }
  }
  async importStatementLines(req, res, next) {
    try { const r = await bankReconciliationService.importStatementLines(req.params.id, req.body, req.user.tenantId); return ApiResponse.success(res, { data: BankReconciliationDTO.toResponse(r), message: 'Statement lines imported' }); } catch (e) { next(e); }
  }
  async manualMatch(req, res, next) {
    try { const { lineId, bankTransactionId } = req.body; const r = await bankReconciliationService.manualMatch(req.params.id, lineId, bankTransactionId, req.user.tenantId); return ApiResponse.success(res, { data: BankReconciliationDTO.toResponse(r), message: 'Line matched' }); } catch (e) { next(e); }
  }
  async unmatchLine(req, res, next) {
    try { const { lineId } = req.body; const r = await bankReconciliationService.unmatchLine(req.params.id, lineId, req.user.tenantId); return ApiResponse.success(res, { data: BankReconciliationDTO.toResponse(r), message: 'Line unmatched' }); } catch (e) { next(e); }
  }
  async completeReconciliation(req, res, next) {
    try { const r = await bankReconciliationService.completeReconciliation(req.params.id, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: BankReconciliationDTO.toResponse(r), message: 'Reconciliation completed' }); } catch (e) { next(e); }
  }
  async overrideCompleteReconciliation(req, res, next) {
    try { const r = await bankReconciliationService.overrideCompleteReconciliation(req.params.id, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: BankReconciliationDTO.toResponse(r), message: 'Reconciliation completed with override' }); } catch (e) { next(e); }
  }
  async reverseReconciliation(req, res, next) {
    try { const r = await bankReconciliationService.reverseReconciliation(req.params.id, req.user.tenantId, req.user.id); return ApiResponse.success(res, { data: BankReconciliationDTO.toResponse(r), message: 'Reconciliation reversed' }); } catch (e) { next(e); }
  }
  async deleteReconciliation(req, res, next) {
    try { await bankReconciliationService.deleteReconciliation(req.params.id, req.user.tenantId); return ApiResponse.success(res, { message: 'Reconciliation deleted' }); } catch (e) { next(e); }
  }
  async getUnmatchedSystemTransactions(req, res, next) {
    try { const { bankAccountId, dateFrom, dateTo } = req.query; if (!bankAccountId) return ApiResponse.badRequest(res, { message: 'bankAccountId is required' }); const t = await bankReconciliationService.getUnmatchedSystemTransactions(bankAccountId, req.user.tenantId, dateFrom, dateTo); return ApiResponse.success(res, { data: t, message: 'Unmatched transactions retrieved' }); } catch (e) { next(e); }
  }
}
module.exports = new BankReconciliationController();
