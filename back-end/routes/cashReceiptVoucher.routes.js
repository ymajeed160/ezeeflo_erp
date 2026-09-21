'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const CRVController = require('../controllers/CashReceiptVoucherController');
const validator = require('../validators/cashReceiptVoucherValidator');
const { authenticate, authorize } = require('../middleware');

router.use(authenticate);

router.get('/', authorize('crv.view'), validator.list, CRVController.list);
router.get('/:id', authorize('crv.view'), validator.idParam, CRVController.getById);
router.post('/', authorize('crv.create'), validator.create, CRVController.create);
router.put('/:id', authorize('crv.edit'), validator.update, CRVController.update);
router.delete('/:id', authorize('crv.delete'), validator.idParam, CRVController.delete);
router.post('/:id/post', authorize('crv.post'), validator.idParam, CRVController.post);
router.post('/:id/reverse', authorize('crv.reverse'), validator.idParam, CRVController.reverse);
router.post('/:id/cancel', authorize('crv.cancel'), validator.idParam, CRVController.cancel);

module.exports = router;
