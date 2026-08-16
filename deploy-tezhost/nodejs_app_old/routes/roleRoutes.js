const express = require('express');
const router = express.Router();
const roleController = require('../controllers/RoleController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { roleValidation } = require('../validators');

router.use(authMiddleware);

router.get('/', requirePermission('roles.read'), roleController.getAll);
router.post('/', requirePermission('roles.create'), roleValidation.create, roleController.create);
router.get('/:id', requirePermission('roles.read'), roleController.getById);
router.put('/:id', requirePermission('roles.update'), roleValidation.update, roleController.update);
router.delete('/:id', requirePermission('roles.delete'), roleController.delete);
router.get('/:id/permissions', requirePermission('roles.read'), roleController.getPermissions);

module.exports = router;