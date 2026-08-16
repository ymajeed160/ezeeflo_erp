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

const supplierValidation = {
  list: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 999 }).toInt(),
    query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
    query('status').optional().isIn(['active', 'inactive', 'blocked']),
    handleValidationErrors,
  ],

  getById: [
    param('id').notEmpty().withMessage('Supplier ID is required'),
    handleValidationErrors,
  ],

  create: [
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Supplier code is required')
      .isLength({ max: 50 })
      .withMessage('Supplier code must be 50 characters or less'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Supplier name is required')
      .isLength({ max: 200 })
      .withMessage('Supplier name must be 200 characters or less'),
    body('email')
      .optional({ values: 'falsy' })
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('mobile').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
    body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
    body('creditLimit').optional().isDecimal({ min: 0 }),
    body('creditDays').optional().isInt({ min: 0 }),
    body('taxNumber').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('vatNumber').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('status').optional().isIn(['active', 'inactive', 'blocked']),
    handleValidationErrors,
  ],

  update: [
    param('id').notEmpty().withMessage('Supplier ID is required'),
    body('code')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Supplier code cannot be empty')
      .isLength({ max: 50 }),
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Supplier name cannot be empty')
      .isLength({ max: 200 }),
    body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail(),
    body('creditLimit').optional().isDecimal({ min: 0 }),
    body('creditDays').optional().isInt({ min: 0 }),
    body('status').optional().isIn(['active', 'inactive', 'blocked']),
    handleValidationErrors,
  ],

  delete: [
    param('id').notEmpty().withMessage('Supplier ID is required'),
    handleValidationErrors,
  ],

  toggleStatus: [
    param('id').notEmpty().withMessage('Supplier ID is required'),
    handleValidationErrors,
  ],
};

module.exports = supplierValidation;