const express = require('express');
const router = express.Router();
const { superAdminAuthMiddleware } = require('../middleware/superAdminAuthMiddleware');
const {
  login, refresh, me, logout, changePassword,
} = require('../controllers/SuperAdminAuthController');

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', superAdminAuthMiddleware, me);
router.post('/logout', superAdminAuthMiddleware, logout);
router.put('/change-password', superAdminAuthMiddleware, changePassword);

module.exports = router;
