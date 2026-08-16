const express = require('express');
const router = express.Router();
const SupplierPaymentController = require('../controllers/SupplierPaymentController');
const { authenticate, authorizeTenant } = require('../middleware/auth');
const hasTenant = require('../middleware/tenantContext');
const { checkPermission } = require('../middleware/rbac');
const { validateCreate, validateUpdate } = require('../validators/supplierPaymentValidator');

router.use(authenticate);
router.use(authorizeTenant);
router.use(hasTenant);

router.get('/', checkPermission('supplierpayment.view'), SupplierPaymentController.getAll);
router.get('/:id', checkPermission('supplierpayment.view'), SupplierPaymentController.getById);
router.post('/', checkPermission('supplierpayment.create'), validateCreate, SupplierPaymentController.create);
router.put('/:id', checkPermission('supplierpayment.edit'), validateUpdate, SupplierPaymentController.update);
router.delete('/:id', checkPermission('supplierpayment.delete'), SupplierPaymentController.delete);
router.post('/:id/confirm', checkPermission('supplierpayment.approve'), SupplierPaymentController.confirm);
router.post('/:id/post-to-journal', checkPermission('supplierpayment.approve'), SupplierPaymentController.postToJournal);

module.exports = router;