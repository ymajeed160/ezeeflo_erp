const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const ApiResponse = require('../utils/apiResponse');

// ==================== Store Management ====================
const storeService = require('../services/StoreService');
router.get('/stores', authMiddleware, requirePermission('stores.view'), async (req, res, next) => {
  try { const result = await storeService.getAll(req.user.companyId, req.query); return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination }); } catch (e) { next(e); }
});
router.get('/stores/regions', authMiddleware, requirePermission('stores.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await storeService.getRegions(req.user.companyId) }); } catch (e) { next(e); }
});
router.get('/stores/:id', authMiddleware, requirePermission('stores.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await storeService.getById(req.params.id, req.user.companyId) }); } catch (e) { next(e); }
});
router.post('/stores', authMiddleware, requirePermission('stores.manage'), async (req, res, next) => {
  try { return ApiResponse.created(res, { data: await storeService.create(req.body, req.user.companyId, req.user.id), message: 'Store created' }); } catch (e) { next(e); }
});
router.put('/stores/:id', authMiddleware, requirePermission('stores.manage'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await storeService.update(req.params.id, req.body, req.user.companyId), message: 'Store updated' }); } catch (e) { next(e); }
});
router.delete('/stores/:id', authMiddleware, requirePermission('stores.manage'), async (req, res, next) => {
  try { await storeService.delete(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Store deleted' }); } catch (e) { next(e); }
});

// ==================== Fraud Detection ====================
const fraudService = require('../services/FraudDetectionService');
router.get('/fraud/rules', authMiddleware, requirePermission('fraud.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await fraudService.getAllRules(req.user.companyId) }); } catch (e) { next(e); }
});
router.post('/fraud/rules', authMiddleware, requirePermission('fraud.manage'), async (req, res, next) => {
  try { return ApiResponse.created(res, { data: await fraudService.createRule(req.body, req.user.companyId, req.user.id) }); } catch (e) { next(e); }
});
router.put('/fraud/rules/:id', authMiddleware, requirePermission('fraud.manage'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await fraudService.updateRule(req.params.id, req.body, req.user.companyId) }); } catch (e) { next(e); }
});
router.delete('/fraud/rules/:id', authMiddleware, requirePermission('fraud.manage'), async (req, res, next) => {
  try { await fraudService.deleteRule(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Rule deleted' }); } catch (e) { next(e); }
});
router.post('/fraud/scan/:customerId', authMiddleware, requirePermission('fraud.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await fraudService.scanCustomer(req.params.customerId, req.user.companyId) }); } catch (e) { next(e); }
});
router.get('/fraud/alerts', authMiddleware, requirePermission('fraud.view'), async (req, res, next) => {
  try { const result = await fraudService.getAlerts(req.user.companyId, req.query); return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination }); } catch (e) { next(e); }
});
router.patch('/fraud/alerts/:id/resolve', authMiddleware, requirePermission('fraud.manage'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await fraudService.resolveAlert(req.params.id, req.body.status, req.user.id, req.body.notes) }); } catch (e) { next(e); }
});

// ==================== Webhooks ====================
const webhookService = require('../services/WebhookService');
router.get('/webhooks', authMiddleware, requirePermission('webhooks.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await webhookService.getAll(req.user.companyId) }); } catch (e) { next(e); }
});
router.post('/webhooks', authMiddleware, requirePermission('webhooks.manage'), async (req, res, next) => {
  try { return ApiResponse.created(res, { data: await webhookService.create(req.body, req.user.companyId, req.user.id) }); } catch (e) { next(e); }
});
router.put('/webhooks/:id', authMiddleware, requirePermission('webhooks.manage'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await webhookService.update(req.params.id, req.body, req.user.companyId) }); } catch (e) { next(e); }
});
router.delete('/webhooks/:id', authMiddleware, requirePermission('webhooks.manage'), async (req, res, next) => {
  try { await webhookService.delete(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Webhook deleted' }); } catch (e) { next(e); }
});
router.get('/webhooks/:id/logs', authMiddleware, requirePermission('webhooks.view'), async (req, res, next) => {
  try { const result = await webhookService.getLogs(req.params.id, req.query); return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination }); } catch (e) { next(e); }
});

module.exports = router;
