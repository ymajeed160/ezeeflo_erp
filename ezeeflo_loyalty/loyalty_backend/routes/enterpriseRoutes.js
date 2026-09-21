const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// ==================== Customer Segmentation ====================
const segmentationService = require('../services/SegmentationService');
const ApiResponse = require('../utils/apiResponse');

router.get('/segments', authMiddleware, requirePermission('segments.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await segmentationService.getAll(req.user.companyId) }); } catch (e) { next(e); }
});
router.get('/segments/:id', authMiddleware, requirePermission('segments.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await segmentationService.getById(req.params.id, req.user.companyId) }); } catch (e) { next(e); }
});
router.post('/segments', authMiddleware, requirePermission('segments.manage'), async (req, res, next) => {
  try { return ApiResponse.created(res, { data: await segmentationService.create(req.body, req.user.companyId, req.user.id), message: 'Segment created' }); } catch (e) { next(e); }
});
router.put('/segments/:id', authMiddleware, requirePermission('segments.manage'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await segmentationService.update(req.params.id, req.body, req.user.companyId), message: 'Segment updated' }); } catch (e) { next(e); }
});
router.delete('/segments/:id', authMiddleware, requirePermission('segments.manage'), async (req, res, next) => {
  try { await segmentationService.delete(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Segment deleted' }); } catch (e) { next(e); }
});
router.post('/segments/:id/refresh', authMiddleware, requirePermission('segments.manage'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await segmentationService.refreshSegment(req.params.id, req.user.companyId) }); } catch (e) { next(e); }
});
router.get('/segments/:id/customers', authMiddleware, requirePermission('segments.view'), async (req, res, next) => {
  try { const result = await segmentationService.getSegmentCustomers(req.params.id, req.user.companyId, req.query); return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination }); } catch (e) { next(e); }
});

// ==================== Gamification ====================
const gamificationService = require('../services/GamificationService');
router.get('/badges', authMiddleware, requirePermission('gamification.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await gamificationService.getAllBadges(req.user.companyId) }); } catch (e) { next(e); }
});
router.post('/badges', authMiddleware, requirePermission('gamification.manage'), async (req, res, next) => {
  try { return ApiResponse.created(res, { data: await gamificationService.createBadge(req.body, req.user.companyId, req.user.id) }); } catch (e) { next(e); }
});
router.put('/badges/:id', authMiddleware, requirePermission('gamification.manage'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await gamificationService.updateBadge(req.params.id, req.body, req.user.companyId) }); } catch (e) { next(e); }
});
router.delete('/badges/:id', authMiddleware, requirePermission('gamification.manage'), async (req, res, next) => {
  try { await gamificationService.deleteBadge(req.params.id, req.user.companyId); return ApiResponse.success(res, { message: 'Badge deleted' }); } catch (e) { next(e); }
});
router.get('/customers/:customerId/badges', authMiddleware, requirePermission('gamification.view'), async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await gamificationService.getCustomerBadges(req.params.customerId, req.user.companyId) }); } catch (e) { next(e); }
});
router.post('/customers/:customerId/check-badges', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await gamificationService.checkAndAwardBadges(req.params.customerId, req.user.companyId) }); } catch (e) { next(e); }
});
router.get('/customers/:customerId/streaks', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await gamificationService.getCustomerStreaks(req.params.customerId, req.user.companyId) }); } catch (e) { next(e); }
});
router.post('/customers/:customerId/streaks/record', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await gamificationService.recordActivity(req.params.customerId, req.user.companyId, req.body.streakType) }); } catch (e) { next(e); }
});

// ==================== Surveys ====================
const { Survey, SurveyResponse } = require('../models');
router.get('/surveys', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await Survey.findAll({ where: { companyId: req.user.companyId }, order: [['createdAt', 'DESC']] }) }); } catch (e) { next(e); }
});
router.post('/surveys', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.created(res, { data: await Survey.create({ ...req.body, companyId: req.user.companyId, createdBy: req.user.id }), message: 'Survey created' }); } catch (e) { next(e); }
});
router.put('/surveys/:id', authMiddleware, async (req, res, next) => {
  try { const s = await Survey.findOne({ where: { id: req.params.id, companyId: req.user.companyId } }); await s.update(req.body); return ApiResponse.success(res, { data: s }); } catch (e) { next(e); }
});
router.delete('/surveys/:id', authMiddleware, async (req, res, next) => {
  try { await Survey.destroy({ where: { id: req.params.id } }); return ApiResponse.success(res, { message: 'Survey deleted' }); } catch (e) { next(e); }
});
router.get('/surveys/:id/responses', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await SurveyResponse.findAll({ where: { surveyId: req.params.id }, include: [{ model: require('../models').Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName'] }], order: [['createdAt', 'DESC']], limit: 100 }) }); } catch (e) { next(e); }
});

// ==================== Digital Membership Card ====================
const digitalCardService = require('../services/DigitalCardService');
router.get('/membership-card/:customerId', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await digitalCardService.generateCard(req.params.customerId, req.user.companyId) }); } catch (e) { next(e); }
});
router.get('/membership-cards', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await digitalCardService.batchGenerateCards(req.user.companyId, req.query) }); } catch (e) { next(e); }
});

// ==================== Customer Notifications ====================
const notificationService = require('../services/NotificationService');
router.get('/customers/:customerId/notifications', authMiddleware, async (req, res, next) => {
  try { const result = await notificationService.getCustomerNotifications(req.params.customerId, req.query); return ApiResponse.paginated(res, { data: result.rows, pagination: result.pagination }); } catch (e) { next(e); }
});
router.post('/customers/:customerId/notify', authMiddleware, async (req, res, next) => {
  try { return ApiResponse.success(res, { data: await notificationService.send({ companyId: req.user.companyId, customerId: req.params.customerId, ...req.body }) }); } catch (e) { next(e); }
});

module.exports = router;
