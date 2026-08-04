const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./index');

const bankAccountIdValidation = [
  param('id')
    .notEmpty().withMessage('Bank account ID is required')
    .isUUID(4).withMessage('Invalid bank account ID format'),
  handleValidationErrors,
];

const createBankAccountValidation = [
  body('accountCode')
    .trim().notEmpty().withMessage('Account code is required')
    .isLength({ min: 1, max: 50 }).withMessage('Account code must be between 1 and 50 characters'),
  body('accountName')
    .trim().notEmpty().withMessage('Account name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Account name must be between 2 and 200 characters'),
  body('bankName')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Bank name must not exceed 200 characters'),
  body('branchName')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Branch name must not exceed 200 characters'),
  body('accountNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Account number must not exceed 100 characters'),
  body('iban')
    .optional({ nullable: true }).trim()
    .isLength({ max: 50 }).withMessage('IBAN must not exceed 50 characters'),
  body('swiftCode')
    .optional({ nullable: true }).trim()
    .isLength({ max: 20 }).withMessage('SWIFT code must not exceed 20 characters'),
  body('currencyCode')
    .trim().notEmpty().withMessage('Currency code is required')
    .isLength({ min: 3, max: 10 }).withMessage('Currency code must be between 3 and 10 characters'),
  body('openingBalance')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Opening balance must be a non-negative number'),
  body('openingBalanceDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Opening balance date must be a valid date'),
  body('chartOfAccountId')
    .notEmpty().withMessage('Chart of account ID is required')
    .isUUID(4).withMessage('Invalid chart of account ID format'),
  body('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  body('notes')
    .optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
  handleValidationErrors,
];

const updateBankAccountValidation = [
  body('accountCode')
    .optional().trim()
    .isLength({ min: 1, max: 50 }).withMessage('Account code must be between 1 and 50 characters'),
  body('accountName')
    .optional().trim()
    .isLength({ min: 2, max: 200 }).withMessage('Account name must be between 2 and 200 characters'),
  body('bankName')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Bank name must not exceed 200 characters'),
  body('branchName')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Branch name must not exceed 200 characters'),
  body('accountNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Account number must not exceed 100 characters'),
  body('iban')
    .optional({ nullable: true }).trim()
    .isLength({ max: 50 }).withMessage('IBAN must not exceed 50 characters'),
  body('swiftCode')
    .optional({ nullable: true }).trim()
    .isLength({ max: 20 }).withMessage('SWIFT code must not exceed 20 characters'),
  body('currencyCode')
    .optional().trim()
    .isLength({ min: 3, max: 10 }).withMessage('Currency code must be between 3 and 10 characters'),
  body('openingBalance')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Opening balance must be a non-negative number'),
  body('openingBalanceDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Opening balance date must be a valid date'),
  body('chartOfAccountId')
    .optional()
    .isUUID(4).withMessage('Invalid chart of account ID format'),
  body('isDefault')
    .optional()
    .isBoolean().withMessage('isDefault must be a boolean'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  body('notes')
    .optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
  handleValidationErrors,
];

module.exports = {
  bankAccountIdValidation,
  createBankAccountValidation,
  updateBankAccountValidation,
};
