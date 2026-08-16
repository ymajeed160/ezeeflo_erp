'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const CPVController = require('../controllers/CashPaymentVoucherController');
const validator = require('../validators/cashPaymentVoucherValidator');
const { authenticate, authorize } = require('../middleware');

router.use(authenticate);

router.get('/', authorize('cpv.view'), validator.list, CPVController.list);
router.get('/:id', authorize('cpv.view'), validator.idParam, CPVController.getById);
router.post('/', authorize('cpv.create'), validator.create, CPVController.create);
router.put('/:id', authorize('cpv.edit'), validator.update, CPVController.update);
router.delete('/:id', authorize('cpv.delete'), validator.idParam, CPVController.delete);
router.post('/:id/post', authorize('cpv.post'), validator.idParam, CPVController.post);
router.post('/:id/reverse', authorize('cpv.reverse'), validator.idParam, CPVController.reverse);
router.post('/:id/cancel', authorize('cpv.cancel'), validator.idParam, CPVController.cancel);

module.exports = router;
