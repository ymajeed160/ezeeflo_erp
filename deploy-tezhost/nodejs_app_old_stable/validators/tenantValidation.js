const { body, validationResult } = require('express-validator');
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

const tenantValidation = {
  update: [
    body('name').optional().trim().notEmpty().withMessage('Tenant name cannot be empty'),
    body('subdomain')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Subdomain cannot be empty')
      .matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/)
      .withMessage('Subdomain must contain only lowercase letters, numbers, and hyphens'),
    body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').optional().trim(),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('country').optional().trim(),
    body('postalCode').optional().trim(),
    body('timezone').optional().trim(),
    body('currencyCode').optional().trim().isLength({ min: 3, max: 3 }).withMessage('Currency code must be 3 characters'),
    body('dateFormat').optional().trim(),
    handleValidationErrors,
  ],
};

module.exports = { tenantValidation };