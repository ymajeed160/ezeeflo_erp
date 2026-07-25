const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/PaymentVoucherController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { createPaymentVoucherValidation, paymentVoucherIdValidation } = require('../validators/paymentVoucherValidation');

router.use(authMiddleware);

router.get('/', requirePermission('paymentvoucher.view'), (r, s, n) => ctrl.getVouchers(r, s, n));
router.get('/invoices-for-allocation', requirePermission('paymentvoucher.view'), (r, s, n) => ctrl.getInvoicesForAllocation(r, s, n));
router.get('/:id', requirePermission('paymentvoucher.view'), paymentVoucherIdValidation, (r, s, n) => ctrl.getVoucherById(r, s, n));
router.post('/', requirePermission('paymentvoucher.create'), createPaymentVoucherValidation, (r, s, n) => ctrl.createVoucher(r, s, n));
router.put('/:id', requirePermission('paymentvoucher.edit'), paymentVoucherIdValidation, (r, s, n) => ctrl.updateVoucher(r, s, n));
router.patch('/:id/post', requirePermission('paymentvoucher.post'), paymentVoucherIdValidation, (r, s, n) => ctrl.postVoucher(r, s, n));
router.patch('/:id/reverse', requirePermission('paymentvoucher.reverse'), paymentVoucherIdValidation, (r, s, n) => ctrl.reverseVoucher(r, s, n));
router.delete('/:id', requirePermission('paymentvoucher.delete'), paymentVoucherIdValidation, (r, s, n) => ctrl.deleteVoucher(r, s, n));

module.exports = router;
