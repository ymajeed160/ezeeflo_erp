const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.badRequest(res, {
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.param, message: e.msg })),
    });
  }
  next();
};

const authValidation = {
  login: [
    body('identifier').notEmpty().withMessage('Email or username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors,
  ],
  refreshToken: [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    handleValidationErrors,
  ],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number'),
    handleValidationErrors,
  ],
  forgotPassword: [
    body('email').isEmail().withMessage('Valid email is required'),
    handleValidationErrors,
  ],
  resetPassword: [
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    handleValidationErrors,
  ],
};

const userValidation = {
  create: [
    body('username')
      .optional({ values: 'null' })
      .trim()
      .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('firstName').optional().trim().isLength({ max: 100 }),
    body('lastName').optional().trim().isLength({ max: 100 }),
    body('roleIds').optional().isArray().withMessage('Role IDs must be an array'),
    handleValidationErrors,
  ],
  update: [
    body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .optional()
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('firstName').optional().trim().isLength({ max: 100 }),
    body('lastName').optional().trim().isLength({ max: 100 }),
    body('roleIds').optional().isArray(),
    handleValidationErrors,
  ],
  toggleStatus: [
    param('id').isUUID().withMessage('Valid user ID is required'),
    handleValidationErrors,
  ],
  unlock: [
    param('id').isUUID().withMessage('Valid user ID is required'),
    handleValidationErrors,
  ],
  idParam: [
    param('id').isUUID().withMessage('Valid ID is required'),
    handleValidationErrors,
  ],
};

const roleValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Role name is required'),
    body('code').trim().notEmpty().withMessage('Role code is required')
      .isLength({ min: 3, max: 50 }),
    body('permissionIds').optional().isArray(),
    handleValidationErrors,
  ],
  update: [
    body('name').optional().trim().notEmpty(),
    body('code').optional().trim().notEmpty(),
    body('permissionIds').optional().isArray(),
    handleValidationErrors,
  ],
};

module.exports = { authValidation, userValidation, roleValidation, handleValidationErrors };
