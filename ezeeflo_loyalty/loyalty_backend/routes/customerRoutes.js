const express = require('express');
const router = express.Router();
const customerController = require('../controllers/CustomerController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { createCustomerValidator, updateCustomerValidator, mergeCustomersValidator } = require('../validators/customerValidator');

router.use(authMiddleware);

// Metadata (must be before /:id)
router.get('/segments', requirePermission('customers.view'), customerController.getSegments);
router.get('/tags', requirePermission('customers.view'), customerController.getTags);

// CRUD
router.get('/', requirePermission('customers.view'), customerController.getAll);
router.get('/:id', requirePermission('customers.view'), customerController.getById);
router.post('/', requirePermission('customers.create'), validate(createCustomerValidator), customerController.create);
router.put('/:id', requirePermission('customers.edit'), validate(updateCustomerValidator), customerController.update);
router.delete('/:id', requirePermission('customers.delete'), customerController.delete);
router.patch('/:id/toggle-status', requirePermission('customers.edit'), customerController.toggleStatus);

// Wallet
router.get('/:id/wallet', requirePermission('customers.view'), customerController.getWallet);

// Merge
router.post('/merge', requirePermission('customers.merge'), validate(mergeCustomersValidator), customerController.merge);

module.exports = router;
