const express = require('express');
const router = express.Router();
const paymentReceiptController = require('../controllers/PaymentReceiptController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createPaymentReceiptValidation, paymentReceiptIdValidation } = require('../validators/paymentReceiptValidation');

router.use(authMiddleware);

router.get('/', requirePermission('paymentreceipt.view'), (req, res, next) => paymentReceiptController.getReceipts(req, res, next));
router.get('/invoices-for-allocation', requirePermission('paymentreceipt.view'), (req, res, next) => paymentReceiptController.getInvoicesForAllocation(req, res, next));
router.get('/:id', requirePermission('paymentreceipt.view'), paymentReceiptIdValidation, (req, res, next) => paymentReceiptController.getReceiptById(req, res, next));
router.post('/', requirePermission('paymentreceipt.create'), createPaymentReceiptValidation, (req, res, next) => paymentReceiptController.createReceipt(req, res, next));
router.put('/:id', requirePermission('paymentreceipt.edit'), paymentReceiptIdValidation, (req, res, next) => paymentReceiptController.updateReceipt(req, res, next));
router.patch('/:id/post', requirePermission('paymentreceipt.post'), paymentReceiptIdValidation, (req, res, next) => paymentReceiptController.postReceipt(req, res, next));
router.patch('/:id/reverse', requirePermission('paymentreceipt.reverse'), paymentReceiptIdValidation, (req, res, next) => paymentReceiptController.reverseReceipt(req, res, next));
router.delete('/:id', requirePermission('paymentreceipt.delete'), paymentReceiptIdValidation, (req, res, next) => paymentReceiptController.deleteReceipt(req, res, next));

module.exports = router;
