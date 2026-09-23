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

const sellingResourceValidation = {
  list: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
    query('sortOrder').optional().isIn(['ASC', 'DESC', 'asc', 'desc']),
    query('isActive').optional().isIn(['true', 'false']),
    handleValidationErrors,
  ],

  getById: [
    param('id').notEmpty().withMessage('Resource ID is required'),
    handleValidationErrors,
  ],

  create: [
    body('resourceCode')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 50 })
      .withMessage('Resource code must be 50 characters or less'),
    body('resourceName')
      .trim()
      .notEmpty()
      .withMessage('Resource name is required')
      .isLength({ max: 200 })
      .withMessage('Resource name must be 200 characters or less'),
    body('resourceTypeId').optional({ values: 'falsy' }).isUUID(),
    body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
    handleValidationErrors,
  ],

  update: [
    param('id').notEmpty().withMessage('Resource ID is required'),
    body('resourceCode')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 50 }),
    body('resourceName')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 200 }),
    body('resourceTypeId').optional({ values: 'falsy' }).isUUID(),
    body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
    handleValidationErrors,
  ],

  createType: [
    body('typeCode')
      .optional({ values: 'falsy' })
      .trim()
      .isLength({ max: 50 })
      .withMessage('Type code must be 50 characters or less'),
    body('typeName')
      .trim()
      .notEmpty()
      .withMessage('Type name is required')
      .isLength({ max: 200 }),
    body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
    handleValidationErrors,
  ],

  updateType: [
    param('id').notEmpty().withMessage('Type ID is required'),
    body('typeCode').optional({ values: 'falsy' }).trim().isLength({ max: 50 }),
    body('typeName').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
    body('description').optional({ values: 'falsy' }).trim().isLength({ max: 1000 }),
    handleValidationErrors,
  ],
};

module.exports = sellingResourceValidation;
