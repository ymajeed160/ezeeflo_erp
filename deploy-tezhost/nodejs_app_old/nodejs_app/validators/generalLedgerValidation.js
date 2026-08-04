const { query, validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/appError');

/**
 * Validation rules for GET /api/general-ledger
 */
const getLedgerValidation = [
  query('accountId')
    .optional()
    .isUUID(4)
    .withMessage('accountId must be a valid UUID'),

  query('dateFrom')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: false })
    .withMessage('dateFrom must be a valid date in YYYY-MM-DD format'),

  query('dateTo')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: false })
    .withMessage('dateTo must be a valid date in YYYY-MM-DD format'),

  query('accountType')
    .optional()
    .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .withMessage('accountType must be one of: asset, liability, equity, revenue, expense'),

  query('journalNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('journalNumber must be a string with at most 50 characters'),

  query('referenceNumber')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('referenceNumber must be a string with at most 100 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('limit must be an integer between 1 and 100'),

  // At least one filter required
  (req, res, next) => {
    const { accountId, accountType } = req.query;
    if (!accountId && !accountType) {
      // Allow empty filter - returns all accounts grouped
    }
    next();
  },
];

/**
 * Validation rules for GET /api/general-ledger/accounts
 */
const getLedgerAccountsValidation = [
  query('type')
    .optional()
    .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .withMessage('type must be one of: asset, liability, equity, revenue, expense'),
];

/**
 * Validation rules for GET /api/general-ledger/account/:accountId/hierarchy
 */
const getAccountHierarchyValidation = [
  query('accountId')
    .optional()
    .isUUID(4)
    .withMessage('accountId must be a valid UUID'),
];

/**
 * Validation rules for GET /api/general-ledger/export
 */
const exportLedgerValidation = [
  query('accountId')
    .optional()
    .isUUID(4)
    .withMessage('accountId must be a valid UUID'),

  query('dateFrom')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: false })
    .withMessage('dateFrom must be a valid date in YYYY-MM-DD format'),

  query('dateTo')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: false })
    .withMessage('dateTo must be a valid date in YYYY-MM-DD format'),

  query('accountType')
    .optional()
    .isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
    .withMessage('accountType must be one of: asset, liability, equity, revenue, expense'),

  // Allow no filters - returns all accounts grouped
  (req, res, next) => {
    next();
  },
];

module.exports = {
  getLedgerValidation,
  getLedgerAccountsValidation,
  getAccountHierarchyValidation,
  exportLedgerValidation,
};