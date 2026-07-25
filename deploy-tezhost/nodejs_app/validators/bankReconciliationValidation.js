const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const reconciliationIdValidation = [
  param('id').notEmpty().withMessage('Reconciliation ID is required').isUUID(4).withMessage('Invalid ID format'),
  handleValidationErrors,
];

const createReconciliationValidation = [
  body('bankAccountId').notEmpty().withMessage('Bank account is required').isUUID(4),
  body('statementDateFrom').notEmpty().withMessage('Statement date from is required').isISO8601(),
  body('statementDateTo').notEmpty().withMessage('Statement date to is required').isISO8601(),
  body('statementOpeningBalance').notEmpty().isFloat({ min: 0 }),
  body('statementClosingBalance').notEmpty().isFloat({ min: 0 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  handleValidationErrors,
];

const importStatementLinesValidation = [
  body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
  body('lines.*.statementTransactionDate').optional().isISO8601(),
  body('lines.*.statementReference').optional().trim().isLength({ max: 200 }),
  body('lines.*.statementDescription').optional().trim(),
  body('lines.*.statementDebitAmount').optional().isFloat({ min: 0 }),
  body('lines.*.statementCreditAmount').optional().isFloat({ min: 0 }),
  handleValidationErrors,
];

module.exports = { reconciliationIdValidation, createReconciliationValidation, importStatementLinesValidation };
