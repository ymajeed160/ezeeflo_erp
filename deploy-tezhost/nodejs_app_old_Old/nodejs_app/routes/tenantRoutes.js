const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/TenantController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { tenantValidation } = require('../validators/tenantValidation');

// All routes require authentication
router.use(authMiddleware);

// Tenant profile
router.get('/my', tenantController.getMyTenant);
router.put('/my', tenantValidation.update, tenantController.updateTenant);

// Logo upload / remove
router.put('/my/logo', upload.single('logo'), tenantController.uploadLogo);
router.delete('/my/logo', tenantController.removeLogo);

module.exports = router;