const express = require('express');
const router = express.Router();
const accountController = require('../controllers/AccountController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { accountValidation } = require('../validators/accountValidation');

// All routes require authentication
router.use(authMiddleware);

// Read operations
router.get('/', requirePermission('chart-of-accounts.read'), accountController.getAll);
router.get('/tree', requirePermission('chart-of-accounts.read'), accountController.getTree);
router.get('/roots', requirePermission('chart-of-accounts.read'), accountController.getRoots);
router.get('/type/:type', requirePermission('chart-of-accounts.read'), accountValidation.typeParam, accountController.getByType);
router.get('/children/:parentId', requirePermission('chart-of-accounts.read'), accountValidation.parentIdParam, accountController.getChildren);
router.get('/:id', requirePermission('chart-of-accounts.read'), accountValidation.idParam, accountController.getById);

// Write operations
router.post('/', requirePermission('chart-of-accounts.create'), accountValidation.create, accountController.create);
router.put('/:id', requirePermission('chart-of-accounts.update'), accountValidation.idParam.concat(accountValidation.update), accountController.update);
router.delete('/:id', requirePermission('chart-of-accounts.delete'), accountValidation.idParam, accountController.delete);
router.patch('/:id/toggle-status', requirePermission('chart-of-accounts.update'), accountValidation.idParam, accountController.toggleStatus);

module.exports = router;