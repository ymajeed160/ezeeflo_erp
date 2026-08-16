const express = require('express');
const router = express.Router();
const reports = require('../reports/fixedAssetReports');
const ApiResponse = require('../utils/apiResponse');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.post('/asset-register', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.assetRegister(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Asset register report' }); } catch (e) { next(e); }
});

router.post('/depreciation-schedule', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.depreciationSchedule(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Depreciation schedule' }); } catch (e) { next(e); }
});

router.post('/movements', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.movementReport(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Movement report' }); } catch (e) { next(e); }
});

router.post('/disposals', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.disposalReport(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Disposal report' }); } catch (e) { next(e); }
});

router.post('/revaluations', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.revaluationReport(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Revaluation report' }); } catch (e) { next(e); }
});

router.post('/maintenance', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.maintenanceReport(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Maintenance report' }); } catch (e) { next(e); }
});

router.post('/insurance', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.insuranceReport(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Insurance report' }); } catch (e) { next(e); }
});

router.post('/warranty-expiry', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.warrantyExpiryReport(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Warranty expiry report' }); } catch (e) { next(e); }
});

router.post('/audits', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.auditReport(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Audit report' }); } catch (e) { next(e); }
});

router.post('/ledger', requirePermission('fixedasset.report'), async (req, res, next) => {
  try { const data = await reports.fixedAssetLedger(req.user.tenantId, req.body); return ApiResponse.success(res, { data, message: 'Fixed asset ledger' }); } catch (e) { next(e); }
});

module.exports = router;
