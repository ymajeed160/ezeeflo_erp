const apiIntegrationService = require('../services/ApiIntegrationService');
const auditService = require('../services/AuditService');
const ApiResponse = require('../utils/apiResponse');

class ApiIntegrationController {
  async createKey(req, res, next) { try { const r = await apiIntegrationService.createApiKey(req.body, req.user.companyId, req.user.id); return ApiResponse.created(res, { data: { ...r.apiKey.toJSON(), rawKey: r.rawKey }, message: 'Save this key - it won\'t be shown again' }); } catch(e) { next(e); } }
  async listKeys(req, res, next) { try { return ApiResponse.success(res, { data: await apiIntegrationService.listApiKeys(req.user.companyId) }); } catch(e) { next(e); } }
  async revokeKey(req, res, next) { try { return ApiResponse.success(res, { data: await apiIntegrationService.revokeApiKey(req.params.id, req.user.companyId), message: 'Key revoked' }); } catch(e) { next(e); } }
  async deleteKey(req, res, next) { try { await apiIntegrationService.deleteApiKey(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Key deleted' }); } catch(e) { next(e); } }

  // POS Integration endpoints
  async posEarn(req, res, next) { try { return ApiResponse.success(res, { data: await apiIntegrationService.posEarnPoints(req.user.companyId, req.body) }); } catch(e) { next(e); } }
  async posBalance(req, res, next) { try { return ApiResponse.success(res, { data: await apiIntegrationService.posGetCustomerBalance(req.user.companyId, req.params.customerId) }); } catch(e) { next(e); } }
  async posRedeem(req, res, next) { try { return ApiResponse.success(res, { data: await apiIntegrationService.posRedeemPoints(req.user.companyId, req.body) }); } catch(e) { next(e); } }
}

class AuditController {
  async getLogs(req, res, next) { try { const r = await auditService.getLogs(req.user.companyId, req.query); return ApiResponse.paginated(res, { data: r.rows, pagination: r.pagination }); } catch(e) { next(e); } }
  async getActions(req, res, next) { try { return ApiResponse.success(res, { data: await auditService.getActions(req.user.companyId) }); } catch(e) { next(e); } }
  async getEntityTypes(req, res, next) { try { return ApiResponse.success(res, { data: await auditService.getEntityTypes(req.user.companyId) }); } catch(e) { next(e); } }
}

module.exports = { ApiIntegrationController: new ApiIntegrationController(), AuditController: new AuditController() };
