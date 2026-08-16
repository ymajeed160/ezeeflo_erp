const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { userValidation } = require('../validators');

router.use(authMiddleware);

router.get('/', requirePermission('users.read'), userController.getAll);
router.post('/', requirePermission('users.create'), userValidation.create, userController.create);
router.put('/profile', userController.updateProfile);
router.get('/:id', requirePermission('users.read'), userValidation.idParam, userController.getById);
router.put('/:id', requirePermission('users.update'), userValidation.idParam, userValidation.update, userController.update);
router.delete('/:id', requirePermission('users.delete'), userValidation.idParam, userController.delete);
router.patch('/:id/toggle-status', requirePermission('users.update'), userValidation.toggleStatus, userController.toggleStatus);
router.patch('/:id/unlock', requirePermission('users.update'), userValidation.unlock, userController.unlock);

module.exports = router;