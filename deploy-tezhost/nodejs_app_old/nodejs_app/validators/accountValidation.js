const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./index');

const accountValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Account name is required')
      .isLength({ min: 2, max: 200 })
      .withMessage('Account name must be between 2 and 200 characters'),
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Account code is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Account code must be between 2 and 50 characters'),
    body('type')
      .trim()
      .notEmpty()
      .withMessage('Account type is required')
      .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
      .withMessage('Type must be: asset, liability, equity, revenue, or expense'),
    body('description')
      .optional({ nullable: true })
      .trim(),
    body('parentAccountId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Parent account ID must be a valid UUID'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('openingBalance')
      .optional()
      .isDecimal()
      .withMessage('Opening balance must be a valid decimal number'),
    handleValidationErrors,
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Account name must be between 2 and 200 characters'),
    body('code')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Account code must be between 2 and 50 characters'),
    body('type')
      .optional()
      .trim()
      .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
      .withMessage('Type must be: asset, liability, equity, revenue, or expense'),
    body('description')
      .optional({ nullable: true })
      .trim(),
    body('parentAccountId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Parent account ID must be a valid UUID'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    body('openingBalance')
      .optional()
      .isDecimal()
      .withMessage('Opening balance must be a valid decimal number'),
    handleValidationErrors,
  ],

  idParam: [
    param('id').isUUID().withMessage('Valid account ID is required'),
    handleValidationErrors,
  ],

  parentIdParam: [
    param('parentId').isUUID().withMessage('Valid parent account ID is required'),
    handleValidationErrors,
  ],

  typeParam: [
    param('type')
      .trim()
      .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
      .withMessage('Type must be: asset, liability, equity, revenue, or expense'),
    handleValidationErrors,
  ],
};

module.exports = { accountValidation };