const express = require('express');
const router = express.Router();
const { superAdminAuthMiddleware } = require('../middleware/superAdminAuthMiddleware');
const { getDashboard } = require('../controllers/SuperAdminDashboardController');

// All routes require super admin authentication
router.use(superAdminAuthMiddleware);

router.get('/', getDashboard);

module.exports = router;
