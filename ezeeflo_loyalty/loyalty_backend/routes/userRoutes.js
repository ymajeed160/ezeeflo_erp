const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const validate = require('../middleware/validate');
const { createUserValidator, updateUserValidator } = require('../validators/userValidator');

router.use(authMiddleware);

router.get('/', requirePermission('users.view'), userController.getAll);
router.get('/:id', requirePermission('users.view'), userController.getById);
router.post('/', requirePermission('users.create'), validate(createUserValidator), userController.create);
router.put('/:id', requirePermission('users.edit'), validate(updateUserValidator), userController.update);
router.delete('/:id', requirePermission('users.delete'), userController.delete);
router.patch('/:id/toggle-status', requirePermission('users.edit'), userController.toggleStatus);

module.exports = router;
