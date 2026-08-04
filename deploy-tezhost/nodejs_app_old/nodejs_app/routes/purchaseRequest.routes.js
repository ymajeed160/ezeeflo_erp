const express = require('express');
const router = express.Router();
const controller = require('../controllers/PurchaseRequestController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.get('/', authenticate, authorize('purchaserequest.view'), controller.list);
router.get('/:id', authenticate, authorize('purchaserequest.view'), controller.getById);
router.post('/', authenticate, authorize('purchaserequest.create'), controller.create);
router.put('/:id', authenticate, authorize('purchaserequest.edit'), controller.update);
router.delete('/:id', authenticate, authorize('purchaserequest.delete'), controller.delete);
router.patch('/:id/status', authenticate, authorize('purchaserequest.approve'), controller.updateStatus);
router.patch('/:id/submit', authenticate, authorize('purchaserequest.create'), controller.submit);
router.patch('/:id/approve', authenticate, authorize('purchaserequest.approve'), controller.approve);
router.patch('/:id/reject', authenticate, authorize('purchaserequest.approve'), controller.reject);

module.exports = router;