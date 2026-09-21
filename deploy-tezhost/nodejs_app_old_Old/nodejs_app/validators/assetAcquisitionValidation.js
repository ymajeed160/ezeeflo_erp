const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const acquisitionIdValidation = [
  param('id')
    .notEmpty().withMessage('Acquisition ID is required')
    .isUUID(4).withMessage('Invalid acquisition ID format'),
  handleValidationErrors,
];

const acquisitionTypes = ['manual', 'purchase_invoice', 'goods_receipt', 'bulk'];
const depreciationMethods = ['straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'];

const createAcquisitionValidation = [
  body('acquisitionNumber')
    .optional().trim()
    .isLength({ max: 50 }).withMessage('Acquisition number must not exceed 50 characters'),
  body('acquisitionDate')
    .optional()
    .isISO8601().withMessage('Acquisition date must be a valid date'),
  body('acquisitionType')
    .optional().trim()
    .isIn(acquisitionTypes).withMessage(`Type must be one of: ${acquisitionTypes.join(', ')}`),
  body('supplierId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid supplier ID format'),
  body('description')
    .optional({ nullable: true }).trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  body('notes')
    .optional({ nullable: true }).trim()
    .isLength({ max: 5000 }).withMessage('Notes must not exceed 5000 characters'),
  body('lines')
    .isArray({ min: 1 }).withMessage('At least one asset line is required'),
  body('lines.*.assetName')
    .trim().notEmpty().withMessage('Asset name is required for each line')
    .isLength({ max: 300 }).withMessage('Asset name must not exceed 300 characters'),
  body('lines.*.categoryId')
    .notEmpty().withMessage('Category ID is required for each line')
    .isUUID(4).withMessage('Invalid category ID format in line'),
  body('lines.*.purchaseCost')
    .notEmpty().withMessage('Purchase cost is required for each line')
    .isFloat({ min: 0 }).withMessage('Purchase cost must be non-negative'),
  body('lines.*.residualValue')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Residual value must be non-negative'),
  body('lines.*.usefulLife')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Useful life must be between 1 and 100'),
  body('lines.*.depreciationMethod')
    .optional().trim()
    .isIn(depreciationMethods).withMessage(`Depreciation method must be one of: ${depreciationMethods.join(', ')}`),
  body('lines.*.serialNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Serial number must not exceed 100 characters'),
  handleValidationErrors,
];

module.exports = {
  createAcquisitionValidation,
  acquisitionIdValidation,
};
