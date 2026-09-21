const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  loginValidator, refreshTokenValidator,
  changePasswordValidator, forgotPasswordValidator, resetPasswordValidator,
} = require('../validators/authValidator');

router.post('/login', authLimiter, validate(loginValidator), authController.login);
router.post('/refresh-token', validate(refreshTokenValidator), authController.refreshToken);
router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);
router.post('/change-password', authMiddleware, validate(changePasswordValidator), authController.changePassword);
router.post('/forgot-password', authLimiter, validate(forgotPasswordValidator), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordValidator), authController.resetPassword);

module.exports = router;
