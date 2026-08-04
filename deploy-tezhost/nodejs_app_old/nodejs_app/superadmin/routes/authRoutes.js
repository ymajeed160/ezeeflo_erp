const express = require('express');
const router = express.Router();
const superAdminAuthController = require('../controllers/SuperAdminAuthController');

// Public route — Super Admin login
router.post('/login', superAdminAuthController.login.bind(superAdminAuthController));

module.exports = router;
