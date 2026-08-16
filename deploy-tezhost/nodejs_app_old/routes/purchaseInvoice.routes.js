'use strict';

const express = require('express');
const router = express.Router();
const purchaseInvoiceController = require('../controllers/PurchaseInvoiceController');
const purchaseInvoiceValidation = require('../validators/purchaseInvoiceValidator');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get(
  '/',
  authorize('purchaseinvoice.view'),
  purchaseInvoiceValidation.list,
  purchaseInvoiceValidation.validate,
  purchaseInvoiceController.list.bind(purchaseInvoiceController)
);

router.get(
  '/:id',
  authorize('purchaseinvoice.view'),
  purchaseInvoiceValidation.getById,
  purchaseInvoiceValidation.validate,
  purchaseInvoiceController.getById.bind(purchaseInvoiceController)
);

router.post(
  '/',
  authorize('purchaseinvoice.create'),
  purchaseInvoiceValidation.create,
  purchaseInvoiceValidation.validate,
  purchaseInvoiceController.create.bind(purchaseInvoiceController)
);

router.put(
  '/:id',
  authorize('purchaseinvoice.edit'),
  purchaseInvoiceValidation.update,
  purchaseInvoiceValidation.validate,
  purchaseInvoiceController.update.bind(purchaseInvoiceController)
);

router.post(
  '/generate-from-po',
  authorize('purchaseinvoice.create'),
  purchaseInvoiceController.generateFromPO.bind(purchaseInvoiceController)
);

router.post(
  '/generate-from-grn',
  authorize('purchaseinvoice.create'),
  purchaseInvoiceController.generateFromGoodsReceipt.bind(purchaseInvoiceController)
);

router.post(
  '/:id/confirm',
  authorize('purchaseinvoice.approve'),
  purchaseInvoiceController.confirm.bind(purchaseInvoiceController)
);

router.post(
  '/:id/approve',
  authorize('purchaseinvoice.approve'),
  purchaseInvoiceController.approve.bind(purchaseInvoiceController)
);

router.post(
  '/:id/cancel',
  authorize('purchaseinvoice.cancel'),
  purchaseInvoiceController.cancel.bind(purchaseInvoiceController)
);

router.delete(
  '/:id',
  authorize('purchaseinvoice.delete'),
  purchaseInvoiceValidation.getById,
  purchaseInvoiceValidation.validate,
  purchaseInvoiceController.delete.bind(purchaseInvoiceController)
);

router.post(
  '/:id/approve',
  authorize('purchaseinvoice.approve'),
  purchaseInvoiceValidation.approve,
  purchaseInvoiceValidation.validate,
  purchaseInvoiceController.approve.bind(purchaseInvoiceController)
);

router.post(
  '/:id/cancel',
  authorize('purchaseinvoice.cancel'),
  purchaseInvoiceValidation.cancel,
  purchaseInvoiceValidation.validate,
  purchaseInvoiceController.cancel.bind(purchaseInvoiceController)
);

router.post(
  '/generate-from-po',
  authorize('purchaseinvoice.create'),
  purchaseInvoiceController.generateFromPO.bind(purchaseInvoiceController)
);

router.post(
  '/generate-from-grn',
  authorize('purchaseinvoice.create'),
  purchaseInvoiceController.generateFromGoodsReceipt.bind(purchaseInvoiceController)
);

router.post(
  '/:id/send-email',
  authorize('purchaseinvoice.view'),
  purchaseInvoiceController.sendEmail.bind(purchaseInvoiceController)
);

module.exports = router;