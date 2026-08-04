const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const assetCategoryIdValidation = [
  param('id')
    .notEmpty().withMessage('Asset category ID is required')
    .isUUID(4).withMessage('Invalid asset category ID format'),
  handleValidationErrors,
];

const depreciationMethods = ['straight_line', 'declining_balance', 'double_declining_balance', 'units_of_production', 'manual'];

const createAssetCategoryValidation = [
  body('categoryCode')
    .trim().notEmpty().withMessage('Category code is required')
    .isLength({ min: 1, max: 50 }).withMessage('Category code must be between 1 and 50 characters'),
  body('categoryName')
    .trim().notEmpty().withMessage('Category name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Category name must be between 2 and 200 characters'),
  body('usefulLifeYears')
    .notEmpty().withMessage('Useful life is required')
    .isInt({ min: 1, max: 100 }).withMessage('Useful life must be between 1 and 100 years'),
  body('depreciationMethod')
    .trim().notEmpty().withMessage('Depreciation method is required')
    .isIn(depreciationMethods).withMessage(`Depreciation method must be one of: ${depreciationMethods.join(', ')}`),
  body('defaultAssetAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid default asset account ID format'),
  body('accumulatedDepreciationAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid accumulated depreciation account ID format'),
  body('depreciationExpenseAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid depreciation expense account ID format'),
  body('gainOnDisposalAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid gain on disposal account ID format'),
  body('lossOnDisposalAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid loss on disposal account ID format'),
  body('defaultTaxAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid default tax account ID format'),
  body('residualValuePercentage')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 }).withMessage('Residual value percentage must be between 0 and 100'),
  body('description')
    .optional({ nullable: true }).trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const updateAssetCategoryValidation = [
  body('categoryCode')
    .optional().trim()
    .isLength({ min: 1, max: 50 }).withMessage('Category code must be between 1 and 50 characters'),
  body('categoryName')
    .optional().trim()
    .isLength({ min: 2, max: 200 }).withMessage('Category name must be between 2 and 200 characters'),
  body('usefulLifeYears')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Useful life must be between 1 and 100 years'),
  body('depreciationMethod')
    .optional().trim()
    .isIn(depreciationMethods).withMessage(`Depreciation method must be one of: ${depreciationMethods.join(', ')}`),
  body('defaultAssetAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid default asset account ID format'),
  body('accumulatedDepreciationAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid accumulated depreciation account ID format'),
  body('depreciationExpenseAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid depreciation expense account ID format'),
  body('gainOnDisposalAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid gain on disposal account ID format'),
  body('lossOnDisposalAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid loss on disposal account ID format'),
  body('defaultTaxAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid default tax account ID format'),
  body('residualValuePercentage')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 }).withMessage('Residual value percentage must be between 0 and 100'),
  body('description')
    .optional({ nullable: true }).trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

module.exports = {
  createAssetCategoryValidation,
  updateAssetCategoryValidation,
  assetCategoryIdValidation,
};
