'use strict';
const router = require('express').Router();
const controller = require('../controllers/PurchaseOrderController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const validator = require('../validators/purchaseOrderValidator');
const hasTenant = require('../middleware/tenantContext');

router.use(authenticate);
router.use(hasTenant);

router.get('/', authorize('purchaseorder.view'), controller.getAll);
router.get('/outstanding', authorize('purchaseorder.view'), controller.getOutstandingPOs);
router.get('/:id', authorize('purchaseorder.view'), controller.getById);
router.post('/', authorize('purchaseorder.create'), validate(validator.createPurchaseOrder), controller.create);
router.post('/generate-from-pr', authorize('purchaseorder.create'), controller.generateFromPR);
router.put('/:id', authorize('purchaseorder.create'), validate(validator.updatePurchaseOrder), controller.update);
router.delete('/:id', authorize('purchaseorder.create'), controller.delete);
router.put('/:id/approve', authorize('purchaseorder.approve'), validate(validator.approve), controller.approve);

module.exports = router;