const express = require('express');
const router = express.Router();
const authController = require('../controllers/AuthController');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { loginValidator } = require('../validators/authValidator');

/**
 * Super Admin Auth - separate login for super admins
 * Validates that the user is a super admin during login
 */
router.post('/login', authLimiter, validate(loginValidator), authController.login);

module.exports = router;
