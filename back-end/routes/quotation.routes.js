const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/QuotationController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const {
  quotationCreateRules,
  quotationUpdateRules,
  statusUpdateRules,
  quotationIdParam,
  validate,
} = require('../validators/quotationValidator');

router.use(auth);

router.get('/', rbac('quotation.view'), quotationController.list);
router.get('/:id/convertible-lines', rbac('quotation.view'), quotationIdParam, validate, quotationController.getConvertibleLines);
router.get('/:id', rbac('quotation.view'), quotationIdParam, validate, quotationController.getById);
router.post('/', rbac('quotation.create'), quotationCreateRules, validate, quotationController.create);
router.put('/:id', rbac('quotations.update'), quotationUpdateRules, validate, quotationController.update);
router.delete('/:id', rbac('quotations.delete'), quotationIdParam, validate, quotationController.delete);
router.patch('/:id/status', rbac('quotations.update'), statusUpdateRules, validate, quotationController.updateStatus);
router.patch('/:id/approve', rbac('quotations.approve'), quotationIdParam, validate, quotationController.approve);
router.post('/:id/confirm', rbac('quotations.approve'), quotationIdParam, validate, quotationController.confirm);
router.patch('/:id/reject', rbac('quotations.update'), quotationIdParam, validate, quotationController.reject);
router.patch('/:id/cancel', rbac('quotations.update'), quotationIdParam, validate, quotationController.cancel);
router.post('/:id/restore', rbac('quotations.update'), quotationIdParam, validate, quotationController.restore);
router.post('/:id/convert-to-sales-order', rbac('quotations.approve'), quotationIdParam, validate, quotationController.convertToSalesOrder);

module.exports = router;