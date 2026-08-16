const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('./index');

const bankTransactionIdValidation = [
  param('id')
    .notEmpty().withMessage('Transaction ID is required')
    .isUUID(4).withMessage('Invalid transaction ID format'),
  handleValidationErrors,
];

const createBankTransactionValidation = [
  body('bankAccountId')
    .notEmpty().withMessage('Bank account ID is required')
    .isUUID(4).withMessage('Invalid bank account ID format'),
  body('transactionDate')
    .notEmpty().withMessage('Transaction date is required')
    .isISO8601().withMessage('Invalid transaction date format'),
  body('valueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Invalid value date format'),
  body('transactionType')
    .notEmpty().withMessage('Transaction type is required')
    .isIn([
      'Deposit', 'Withdrawal', 'Transfer In', 'Transfer Out',
      'Bank Charge', 'Interest Income', 'Interest Expense',
      'Cheque Deposit', 'Cheque Payment', 'Direct Debit', 'Direct Credit',
      'Adjustment', 'Opening Balance', 'Imported Statement',
    ]).withMessage('Invalid transaction type'),
  body('direction')
    .notEmpty().withMessage('Direction is required')
    .isIn(['In', 'Out']).withMessage('Direction must be In or Out'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('referenceNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Reference number must not exceed 100 characters'),
  body('externalReference')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('External reference must not exceed 200 characters'),
  body('description')
    .optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('offsetAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid offset account ID format'),
  body('notes')
    .optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
  handleValidationErrors,
];

const updateBankTransactionValidation = [
  body('transactionDate')
    .optional()
    .isISO8601().withMessage('Invalid transaction date format'),
  body('valueDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Invalid value date format'),
  body('transactionType')
    .optional()
    .isIn([
      'Deposit', 'Withdrawal', 'Transfer In', 'Transfer Out',
      'Bank Charge', 'Interest Income', 'Interest Expense',
      'Cheque Deposit', 'Cheque Payment', 'Direct Debit', 'Direct Credit',
      'Adjustment', 'Opening Balance', 'Imported Statement',
    ]).withMessage('Invalid transaction type'),
  body('direction')
    .optional()
    .isIn(['In', 'Out']).withMessage('Direction must be In or Out'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('referenceNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Reference number must not exceed 100 characters'),
  body('externalReference')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('External reference must not exceed 200 characters'),
  body('description')
    .optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('offsetAccountId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid offset account ID format'),
  body('notes')
    .optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
  handleValidationErrors,
];

const bankTransactionFilterValidation = [
  query('bankAccountId')
    .optional()
    .isUUID(4).withMessage('Invalid bank account ID format'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  handleValidationErrors,
];

module.exports = {
  bankTransactionIdValidation,
  createBankTransactionValidation,
  updateBankTransactionValidation,
  bankTransactionFilterValidation,
};
