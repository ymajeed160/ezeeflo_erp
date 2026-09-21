const { body } = require('express-validator');

const loginValidator = [
  body('username').notEmpty().withMessage('Username or email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

module.exports = {
  loginValidator,
  refreshTokenValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
