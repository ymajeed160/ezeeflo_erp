'use strict';
const express = require('express');
const router = express.Router();
const PosSessionController = require('../controllers/PosSessionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { companyMiddleware } = require('../middleware/companyMiddleware');
const { requirePOSSubscription } = require('../middleware/posSubscriptionMiddleware');
const validate = require('../middleware/validate');

router.use(authMiddleware);
router.use(companyMiddleware);

router.get('/', requirePermission('pos.view'), PosSessionController.list);
router.get('/active', requirePermission('pos.open_session'), PosSessionController.getActiveSession);
router.get('/:id', requirePermission('pos.view'), PosSessionController.getById);
router.get('/:id/summary', requirePermission('pos.view_reports'), PosSessionController.getSessionSummary);
router.post('/open', requirePermission('pos.open_session'), PosSessionController.openSession);
router.post('/:id/close', requirePermission('pos.close_session'), PosSessionController.closeSession);

module.exports = router;
