'use strict';
const express = require('express');
const router = express.Router();
const PosSaleController = require('../controllers/PosSaleController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { companyMiddleware } = require('../middleware/companyMiddleware');
const { requirePOSSubscription } = require('../middleware/posSubscriptionMiddleware');
const validate = require('../middleware/validate');

router.use(authMiddleware);
router.use(companyMiddleware);
router.use(requirePOSSubscription);

router.get('/', requirePermission('pos.view'), PosSaleController.list);
router.get('/:id', requirePermission('pos.view'), PosSaleController.getById);
router.post('/complete', requirePermission('pos.create_sale'), PosSaleController.completeSale);
router.post('/:id/cancel', requirePermission('pos.cancel_sale'), PosSaleController.cancelSale);
router.post('/hold', requirePermission('pos.hold_sale'), PosSaleController.holdOrder);
router.get('/hold/list', requirePermission('pos.hold_sale'), PosSaleController.listHeldOrders);
router.post('/hold/:id/retrieve', requirePermission('pos.hold_sale'), PosSaleController.retrieveHeldOrder);

module.exports = router;
