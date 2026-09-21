'use strict';
const express = require('express');
const router = express.Router();
const PosCashManagementController = require('../controllers/PosCashManagementController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { companyMiddleware } = require('../middleware/companyMiddleware');
const { requirePOSSubscription } = require('../middleware/posSubscriptionMiddleware');
const validate = require('../middleware/validate');

router.use(authMiddleware);
router.use(companyMiddleware);
router.use(requirePOSSubscription);

router.get('/', requirePermission('pos.view'), PosCashManagementController.list);
router.post('/', requirePermission('pos.cash_in'), PosCashManagementController.recordMovement);

module.exports = router;
