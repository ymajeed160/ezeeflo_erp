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
router.get('/:id', rbac('quotation.view'), quotationIdParam, validate, quotationController.getById);
router.post('/', rbac('quotation.create'), quotationCreateRules, validate, quotationController.create);
router.put('/:id', rbac('quotation.edit'), quotationUpdateRules, validate, quotationController.update);
router.delete('/:id', rbac('quotation.delete'), quotationIdParam, validate, quotationController.delete);
router.patch('/:id/status', rbac('quotation.edit'), statusUpdateRules, validate, quotationController.updateStatus);
router.patch('/:id/approve', rbac('quotation.approve'), quotationIdParam, validate, quotationController.approve);
router.patch('/:id/reject', rbac('quotation.edit'), quotationIdParam, validate, quotationController.reject);
router.post('/:id/convert-to-sales-order', rbac('quotation.approve'), quotationIdParam, validate, quotationController.convertToSalesOrder);

module.exports = router;