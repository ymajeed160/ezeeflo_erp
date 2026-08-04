const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const adjustmentIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Adjustment ID is required')
    .isUUID(4)
    .withMessage('Invalid adjustment ID format'),
  handleValidationErrors,
];

const createStockAdjustmentValidation = [
  body('warehouseId')
    .trim()
    .notEmpty()
    .withMessage('Warehouse is required')
    .isUUID(4)
    .withMessage('Invalid warehouse ID format'),
  body('adjustmentDate')
    .notEmpty()
    .withMessage('Adjustment date is required')
    .isISO8601()
    .withMessage('Adjustment date must be a valid date'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isIn(['physical_count', 'damage', 'expiry', 'theft', 'correction', 'initial_stock'])
    .withMessage('Invalid adjustment reason'),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  body('details')
    .isArray({ min: 1 })
    .withMessage('At least one adjustment detail is required'),
  body('details.*.itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required for each detail')
    .isUUID(4)
    .withMessage('Invalid item ID format'),
  body('details.*.currentQuantity')
    .isDecimal({ force_decimal: false })
    .withMessage('Current quantity must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined && parseFloat(value) < 0) {
        throw new Error('Current quantity cannot be negative');
      }
      return true;
    }),
  body('details.*.adjustedQuantity')
    .isDecimal({ force_decimal: false })
    .withMessage('Adjusted quantity must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined && parseFloat(value) < 0) {
        throw new Error('Adjusted quantity cannot be negative');
      }
      return true;
    }),
  body('details.*.unitCost')
    .optional({ nullable: true })
    .isDecimal({ force_decimal: false })
    .withMessage('Unit cost must be a valid number')
    .custom((value) => {
      if (value !== null && value !== undefined && parseFloat(value) < 0) {
        throw new Error('Unit cost cannot be negative');
      }
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  adjustmentIdValidation,
  createStockAdjustmentValidation,
};