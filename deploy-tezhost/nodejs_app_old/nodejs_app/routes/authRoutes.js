const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authValidation } = require('../validators');

// Public routes
router.post('/login', authValidation.login, authController.login);
router.post('/refresh-token', authValidation.refreshToken, authController.refreshToken);
router.post('/forgot-password', authValidation.forgotPassword, authController.forgotPassword);
router.post('/reset-password', authValidation.resetPassword, authController.resetPassword);

// Protected routes
router.use(authMiddleware);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.post('/change-password', authValidation.changePassword, authController.changePassword);
router.get('/me', authController.me);

module.exports = router;