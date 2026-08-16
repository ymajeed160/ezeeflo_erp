const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const assetIdValidation = [
  param('id')
    .notEmpty().withMessage('Asset ID is required')
    .isUUID(4).withMessage('Invalid asset ID format'),
  handleValidationErrors,
];

const statuses = ['draft', 'active', 'disposed', 'sold', 'transferred', 'under_maintenance', 'retired', 'lost'];
const conditions = ['new', 'good', 'fair', 'poor', 'damaged', 'obsolete'];
const depreciationMethods = ['straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'];

const createAssetValidation = [
  body('assetCode')
    .optional().trim()
    .isLength({ max: 50 }).withMessage('Asset code must not exceed 50 characters'),
  body('assetName')
    .trim().notEmpty().withMessage('Asset name is required')
    .isLength({ min: 2, max: 300 }).withMessage('Asset name must be between 2 and 300 characters'),
  body('categoryId')
    .notEmpty().withMessage('Asset category is required')
    .isUUID(4).withMessage('Invalid category ID format'),
  body('serialNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Serial number must not exceed 100 characters'),
  body('barcode')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Barcode must not exceed 200 characters'),
  body('manufacturer')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Manufacturer must not exceed 200 characters'),
  body('model')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Model must not exceed 200 characters'),
  body('purchaseDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Purchase date must be a valid date'),
  body('capitalizationDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Capitalization date must be a valid date'),
  body('supplierId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid supplier ID format'),
  body('purchaseInvoiceId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid purchase invoice ID format'),
  body('purchaseCost')
    .notEmpty().withMessage('Purchase cost is required')
    .isFloat({ min: 0 }).withMessage('Purchase cost must be a non-negative number'),
  body('residualValue')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Residual value must be a non-negative number'),
  body('usefulLife')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Useful life must be between 1 and 100 years'),
  body('depreciationMethod')
    .optional().trim()
    .isIn(depreciationMethods).withMessage(`Depreciation method must be one of: ${depreciationMethods.join(', ')}`),
  body('location')
    .optional({ nullable: true }).trim()
    .isLength({ max: 300 }).withMessage('Location must not exceed 300 characters'),
  body('department')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Department must not exceed 200 characters'),
  body('custodian')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Custodian must not exceed 200 characters'),
  body('warrantyExpiry')
    .optional({ nullable: true })
    .isISO8601().withMessage('Warranty expiry must be a valid date'),
  body('condition')
    .optional().trim()
    .isIn(conditions).withMessage(`Condition must be one of: ${conditions.join(', ')}`),
  body('status')
    .optional().trim()
    .isIn(statuses).withMessage(`Status must be one of: ${statuses.join(', ')}`),
  body('notes')
    .optional({ nullable: true }).trim()
    .isLength({ max: 5000 }).withMessage('Notes must not exceed 5000 characters'),
  handleValidationErrors,
];

const updateAssetValidation = [
  body('assetCode')
    .optional().trim()
    .isLength({ max: 50 }).withMessage('Asset code must not exceed 50 characters'),
  body('assetName')
    .optional().trim()
    .isLength({ min: 2, max: 300 }).withMessage('Asset name must be between 2 and 300 characters'),
  body('categoryId')
    .optional()
    .isUUID(4).withMessage('Invalid category ID format'),
  body('serialNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Serial number must not exceed 100 characters'),
  body('barcode')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Barcode must not exceed 200 characters'),
  body('manufacturer')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Manufacturer must not exceed 200 characters'),
  body('model')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Model must not exceed 200 characters'),
  body('purchaseDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Purchase date must be a valid date'),
  body('capitalizationDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Capitalization date must be a valid date'),
  body('supplierId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid supplier ID format'),
  body('purchaseInvoiceId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid purchase invoice ID format'),
  body('purchaseCost')
    .optional()
    .isFloat({ min: 0 }).withMessage('Purchase cost must be a non-negative number'),
  body('residualValue')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Residual value must be a non-negative number'),
  body('usefulLife')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Useful life must be between 1 and 100 years'),
  body('depreciationMethod')
    .optional().trim()
    .isIn(depreciationMethods).withMessage(`Depreciation method must be one of: ${depreciationMethods.join(', ')}`),
  body('location')
    .optional({ nullable: true }).trim()
    .isLength({ max: 300 }).withMessage('Location must not exceed 300 characters'),
  body('department')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Department must not exceed 200 characters'),
  body('custodian')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Custodian must not exceed 200 characters'),
  body('warrantyExpiry')
    .optional({ nullable: true })
    .isISO8601().withMessage('Warranty expiry must be a valid date'),
  body('condition')
    .optional().trim()
    .isIn(conditions).withMessage(`Condition must be one of: ${conditions.join(', ')}`),
  body('status')
    .optional().trim()
    .isIn(statuses).withMessage(`Status must be one of: ${statuses.join(', ')}`),
  body('notes')
    .optional({ nullable: true }).trim()
    .isLength({ max: 5000 }).withMessage('Notes must not exceed 5000 characters'),
  handleValidationErrors,
];

const updateAssetStatusValidation = [
  body('status')
    .trim().notEmpty().withMessage('Status is required')
    .isIn(statuses).withMessage(`Status must be one of: ${statuses.join(', ')}`),
  handleValidationErrors,
];

module.exports = {
  createAssetValidation,
  updateAssetValidation,
  assetIdValidation,
  updateAssetStatusValidation,
};
