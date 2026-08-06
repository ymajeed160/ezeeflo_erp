const express = require('express');
const router = express.Router();
const roleController = require('../controllers/RoleController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { createRoleValidator, updateRoleValidator } = require('../validators/roleValidator');

router.use(authMiddleware);

router.get('/', requirePermission('roles.view'), roleController.getAll);
router.get('/:id', requirePermission('roles.view'), roleController.getById);
router.post('/', requirePermission('roles.create'), validate(createRoleValidator), roleController.create);
router.put('/:id', requirePermission('roles.edit'), validate(updateRoleValidator), roleController.update);
router.delete('/:id', requirePermission('roles.delete'), roleController.delete);
router.post('/:id/permissions', requirePermission('roles.edit'), roleController.assignPermissions);

module.exports = router;
