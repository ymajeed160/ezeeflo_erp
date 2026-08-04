const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/PermissionController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', permissionController.getAll);
router.get('/modules', permissionController.getModules);
router.get('/module/:module', permissionController.getByModule);

module.exports = router;