const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const transferIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Transfer ID is required')
    .isUUID(4)
    .withMessage('Invalid transfer ID format'),
  handleValidationErrors,
];

const createStockTransferValidation = [
  body('fromWarehouseId')
    .trim()
    .notEmpty()
    .withMessage('Source warehouse is required')
    .isUUID(4)
    .withMessage('Invalid source warehouse ID format'),
  body('toWarehouseId')
    .trim()
    .notEmpty()
    .withMessage('Destination warehouse is required')
    .isUUID(4)
    .withMessage('Invalid destination warehouse ID format'),
  body('transferDate')
    .notEmpty()
    .withMessage('Transfer date is required')
    .isISO8601()
    .withMessage('Transfer date must be a valid date'),
  body('notes')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),
  body('details')
    .isArray({ min: 1 })
    .withMessage('At least one transfer detail is required'),
  body('details.*.itemId')
    .trim()
    .notEmpty()
    .withMessage('Item ID is required for each detail')
    .isUUID(4)
    .withMessage('Invalid item ID format'),
  body('details.*.quantity')
    .isFloat({ gt: 0 })
    .withMessage('Quantity must be greater than zero'),
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
  transferIdValidation,
  createStockTransferValidation,
};