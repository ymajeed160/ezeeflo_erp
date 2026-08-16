'use strict';
const express = require('express');
const router = express.Router();
const PosReturnController = require('../controllers/PosReturnController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { companyMiddleware } = require('../middleware/companyMiddleware');
const { requirePOSSubscription } = require('../middleware/posSubscriptionMiddleware');
const validate = require('../middleware/validate');

router.use(authMiddleware);
router.use(companyMiddleware);
router.use(requirePOSSubscription);

router.get('/', requirePermission('pos.return'), PosReturnController.list);
router.get('/:id', requirePermission('pos.return'), PosReturnController.getById);
router.post('/', requirePermission('pos.return'), PosReturnController.processReturn);

module.exports = router;
