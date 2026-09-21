'use strict';
const express = require('express');
const router = express.Router();
const PosTerminalController = require('../controllers/PosTerminalController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { companyMiddleware } = require('../middleware/companyMiddleware');
const { requirePOSSubscription } = require('../middleware/posSubscriptionMiddleware');
const validate = require('../middleware/validate');

router.use(authMiddleware);
router.use(companyMiddleware);

router.get('/my-terminals', requirePermission('pos.view'), PosTerminalController.getUserTerminals);
router.get('/', requirePermission('pos.manage_terminals'), PosTerminalController.list);
router.get('/:id', requirePermission('pos.view'), PosTerminalController.getById);
router.post('/', requirePermission('pos.manage_terminals'), PosTerminalController.create);
router.put('/:id', requirePermission('pos.manage_terminals'), PosTerminalController.update);
router.delete('/:id', requirePermission('pos.manage_terminals'), PosTerminalController.delete);

module.exports = router;
