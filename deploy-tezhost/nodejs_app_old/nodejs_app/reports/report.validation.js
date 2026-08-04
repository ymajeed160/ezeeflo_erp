'use strict';

const { query, param, validationResult } = require('express-validator');

/**
 * Generic validation for report endpoints.
 * All report query params are optional.
 */
const validateReportQuery = [
  param('reportName').isString().trim().notEmpty().withMessage('Report name is required'),
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

module.exports = { validateReportQuery };
