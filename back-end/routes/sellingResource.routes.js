const express = require('express');
const router = express.Router();
const SellingResourceController = require('../controllers/SellingResourceController');
const { authenticate, authorizeTenant } = require('../middleware/auth');
const hasTenant = require('../middleware/tenantContext');
const { checkPermission } = require('../middleware/rbac');
const validation = require('../validators/sellingResourceValidator');

router.use(authenticate);
router.use(authorizeTenant);
router.use(hasTenant);

// ---------- Selling Resources ----------
router.get('/', checkPermission('sellingresource.view'), validation.list, SellingResourceController.getAll);
router.get('/select', checkPermission('sellingresource.view'), SellingResourceController.getForSelect);
router.get('/:id', checkPermission('sellingresource.view'), validation.getById, SellingResourceController.getById);
router.post('/', checkPermission('sellingresource.create'), validation.create, SellingResourceController.create);
router.put('/:id', checkPermission('sellingresource.edit'), validation.update, SellingResourceController.update);
router.delete('/:id', checkPermission('sellingresource.delete'), validation.getById, SellingResourceController.delete);
router.patch('/:id/toggle-status', checkPermission('sellingresource.edit'), validation.getById, SellingResourceController.toggleStatus);

// ---------- Resource Types ----------
router.get('/types/list', checkPermission('sellingresource.view'), validation.list, SellingResourceController.getAllTypes);
router.get('/types/:id', checkPermission('sellingresource.view'), validation.getById, SellingResourceController.getTypeById);
router.post('/types', checkPermission('sellingresource.create'), validation.createType, SellingResourceController.createType);
router.put('/types/:id', checkPermission('sellingresource.edit'), validation.updateType, SellingResourceController.updateType);
router.delete('/types/:id', checkPermission('sellingresource.delete'), validation.getById, SellingResourceController.deleteType);

module.exports = router;
