const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const createEntryValidation = [
  body('entryDate')
    .optional()
    .isISO8601()
    .withMessage('Entry date must be a valid date'),
  body('reference')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference must be at most 100 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('fiscalPeriodId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Fiscal period ID must be a valid UUID'),
  body('lines')
    .isArray({ min: 2 })
    .withMessage('Journal entry must have at least 2 lines'),
  body('lines.*.accountId')
    .notEmpty()
    .withMessage('Account ID is required for each line')
    .isUUID(4)
    .withMessage('Account ID must be a valid UUID'),
  body('lines.*.description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Line description must be at most 500 characters'),
  body('lines.*.debit')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Debit must be a decimal with up to 2 decimal places'),
  body('lines.*.credit')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Credit must be a decimal with up to 2 decimal places'),
  handleValidationErrors,
];

const updateEntryValidation = [
  body('entryDate')
    .optional()
    .isISO8601()
    .withMessage('Entry date must be a valid date'),
  body('reference')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference must be at most 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),
  body('fiscalPeriodId')
    .optional({ nullable: true })
    .isUUID(4)
    .withMessage('Fiscal period ID must be a valid UUID'),
  body('lines')
    .optional()
    .isArray({ min: 2 })
    .withMessage('Journal entry must have at least 2 lines'),
  body('lines.*.accountId')
    .optional()
    .isUUID(4)
    .withMessage('Account ID must be a valid UUID'),
  body('lines.*.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Line description must be at most 500 characters'),
  body('lines.*.debit')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Debit must be a decimal with up to 2 decimal places'),
  body('lines.*.credit')
    .optional({ nullable: true })
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Credit must be a decimal with up to 2 decimal places'),
  handleValidationErrors,
];

const idParam = [
  param('id')
    .notEmpty()
    .withMessage('Journal entry ID is required')
    .isUUID(4)
    .withMessage('Journal entry ID must be a valid UUID'),
  handleValidationErrors,
];

module.exports = {
  createEntryValidation,
  updateEntryValidation,
  idParam,
};