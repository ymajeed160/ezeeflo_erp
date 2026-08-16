const { body, param, query, validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ApiResponse.badRequest(res, {
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.param, message: e.msg })),
    });
  }
  next();
};

const customerValidation = {
  list: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 9999 }).toInt(),
    query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
    query('status').optional().isIn(['active', 'inactive', 'blocked']),
    query('group').optional().isIn(['retail', 'wholesale', 'corporate', 'government']),
    query('type').optional().isIn(['individual', 'company']),
    handleValidationErrors,
  ],

  getById: [
    param('id').notEmpty().withMessage('Customer ID is required'),
    handleValidationErrors,
  ],

  create: [
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Customer code is required')
      .isLength({ max: 50 })
      .withMessage('Customer code must be 50 characters or less'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Customer name is required')
      .isLength({ max: 200 })
      .withMessage('Customer name must be 200 characters or less'),
    body('email')
      .optional({ values: 'falsy' })
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('mobile').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
    body('group').optional().isIn(['retail', 'wholesale', 'corporate', 'government']),
    body('type').optional().isIn(['individual', 'company']),
    body('creditLimit').optional().isDecimal({ min: 0 }),
    body('creditDays').optional().isInt({ min: 0 }),
    body('vatNumber').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('taxNumber').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('status').optional().isIn(['active', 'inactive', 'blocked']),
    handleValidationErrors,
  ],

  update: [
    param('id').notEmpty().withMessage('Customer ID is required'),
    body('code')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Customer code cannot be empty')
      .isLength({ max: 50 })
      .withMessage('Customer code must be 50 characters or less'),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Customer name cannot be empty')
      .isLength({ max: 200 })
      .withMessage('Customer name must be 200 characters or less'),
    body('email')
      .optional({ values: 'falsy' })
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('creditLimit').optional().isDecimal({ min: 0 }),
    body('creditDays').optional().isInt({ min: 0 }),
    body('status').optional().isIn(['active', 'inactive', 'blocked']),
    handleValidationErrors,
  ],

  delete: [
    param('id').notEmpty().withMessage('Customer ID is required'),
    handleValidationErrors,
  ],

  toggleStatus: [
    param('id').notEmpty().withMessage('Customer ID is required'),
    handleValidationErrors,
  ],
};

module.exports = customerValidation;