'use strict';

const { query, validationResult } = require('express-validator');

const validateGeneralLedger = [
  query('accountId').optional().isUUID().withMessage('Valid Account ID is required'),
  query('dateFrom').optional().isISO8601().withMessage('Valid Date From is required (YYYY-MM-DD)'),
  query('dateTo').optional().isISO8601().withMessage('Valid Date To is required (YYYY-MM-DD)'),
  query('journalNumber').optional().trim(),
  query('referenceNumber').optional().trim(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 500 }).toInt(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateGeneralLedger };
