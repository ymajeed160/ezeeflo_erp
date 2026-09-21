const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/PermissionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/', requirePermission('permissions.view'), permissionController.getAll);
router.get('/groups', requirePermission('permissions.view'), permissionController.getGroups);
router.post('/', requirePermission('permissions.create'), permissionController.create);
router.put('/:id', requirePermission('permissions.edit'), permissionController.update);
router.delete('/:id', requirePermission('permissions.delete'), permissionController.delete);

module.exports = router;
