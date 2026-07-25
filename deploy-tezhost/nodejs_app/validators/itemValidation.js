const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const itemIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Item ID is required')
    .isUUID(4)
    .withMessage('Invalid item ID format'),
  handleValidationErrors,
];

const createItemValidation = [
  body('itemCode')
    .trim()
    .notEmpty()
    .withMessage('Item code is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Item code must be between 1 and 100 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Item name must be between 2 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('itemType')
    .trim()
    .notEmpty()
    .withMessage('Item type is required')
    .isIn(['product', 'service'])
    .withMessage('Item type must be "product" or "service"'),
  body('unitOfMeasure')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Unit of measure must not exceed 50 characters'),
  body('costPrice')
    .optional({ nullable: true })
    .isDecimal({ force_decimal: false })
    .withMessage('Cost price must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined && parseFloat(value) < 0) {
        throw new Error('Cost price cannot be negative');
      }
      return true;
    }),
  body('sellingPrice')
    .optional({ nullable: true })
    .isDecimal({ force_decimal: false })
    .withMessage('Selling price must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined && parseFloat(value) < 0) {
        throw new Error('Selling price cannot be negative');
      }
      return true;
    }),
  body('taxPercentage')
    .optional({ nullable: true })
    .isDecimal({ force_decimal: false })
    .withMessage('Tax percentage must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined) {
        const num = parseFloat(value);
        if (num < 0 || num > 100) {
          throw new Error('Tax percentage must be between 0 and 100');
        }
      }
      return true;
    }),
  body('isInventoryTracked')
    .optional()
    .isBoolean()
    .withMessage('isInventoryTracked must be a boolean'),
  body('categoryId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid category ID format'),
  body('incomeAccountId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid income account ID format'),
  body('expenseAccountId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid expense account ID format'),
  body('inventoryAccountId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid inventory account ID format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const updateItemValidation = [
  param('id')
    .notEmpty()
    .withMessage('Item ID is required')
    .isUUID(4)
    .withMessage('Invalid item ID format'),
  body('itemCode')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Item code must be between 1 and 100 characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Item name must be between 2 and 200 characters'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('itemType')
    .optional()
    .trim()
    .isIn(['product', 'service'])
    .withMessage('Item type must be "product" or "service"'),
  body('unitOfMeasure')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Unit of measure must not exceed 50 characters'),
  body('costPrice')
    .optional({ nullable: true })
    .isDecimal({ force_decimal: false })
    .withMessage('Cost price must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined && parseFloat(value) < 0) {
        throw new Error('Cost price cannot be negative');
      }
      return true;
    }),
  body('sellingPrice')
    .optional({ nullable: true })
    .isDecimal({ force_decimal: false })
    .withMessage('Selling price must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined && parseFloat(value) < 0) {
        throw new Error('Selling price cannot be negative');
      }
      return true;
    }),
  body('taxPercentage')
    .optional({ nullable: true })
    .isDecimal({ force_decimal: false })
    .withMessage('Tax percentage must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined) {
        const num = parseFloat(value);
        if (num < 0 || num > 100) {
          throw new Error('Tax percentage must be between 0 and 100');
        }
      }
      return true;
    }),
  body('isInventoryTracked')
    .optional()
    .isBoolean()
    .withMessage('isInventoryTracked must be a boolean'),
  body('categoryId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid category ID format'),
  body('incomeAccountId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid income account ID format'),
  body('expenseAccountId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid expense account ID format'),
  body('inventoryAccountId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Invalid inventory account ID format'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

module.exports = {
  itemIdValidation,
  createItemValidation,
  updateItemValidation,
};