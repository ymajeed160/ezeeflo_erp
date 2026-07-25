const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const warehouseIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Warehouse ID is required')
    .isUUID(4)
    .withMessage('Invalid warehouse ID format'),
  handleValidationErrors,
];

const createWarehouseValidation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Warehouse code is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Warehouse code must be between 1 and 50 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Warehouse name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Warehouse name must be between 2 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  body('managerName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Manager name must not exceed 200 characters'),
  body('contactNumber')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Contact number must not exceed 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const updateWarehouseValidation = [
  param('id')
    .notEmpty()
    .withMessage('Warehouse ID is required')
    .isUUID(4)
    .withMessage('Invalid warehouse ID format'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Warehouse code must be between 1 and 50 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Warehouse name must be between 2 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('location')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),
  body('managerName')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Manager name must not exceed 200 characters'),
  body('contactNumber')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Contact number must not exceed 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

module.exports = {
  warehouseIdValidation,
  createWarehouseValidation,
  updateWarehouseValidation,
};