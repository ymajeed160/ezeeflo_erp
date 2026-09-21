const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const categoryIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID(4)
    .withMessage('Invalid category ID format'),
  handleValidationErrors,
];

const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Category name must be between 2 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('parentCategoryId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid parent category ID format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const updateCategoryValidation = [
  param('id')
    .notEmpty()
    .withMessage('Category ID is required')
    .isUUID(4)
    .withMessage('Invalid category ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Category name must be between 2 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('parentCategoryId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid parent category ID format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

module.exports = {
  categoryIdValidation,
  createCategoryValidation,
  updateCategoryValidation,
};