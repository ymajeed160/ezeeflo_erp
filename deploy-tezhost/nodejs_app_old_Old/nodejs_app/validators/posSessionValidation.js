'use strict';
const { body, param } = require('express-validator');

const openSession = [
  body('terminalId')
    .notEmpty().withMessage('Terminal ID is required')
    .isUUID().withMessage('Terminal ID must be a valid UUID'),
  body('openingCash')
    .optional()
    .isFloat({ min: 0 }).withMessage('Opening cash must be a non-negative number'),
  body('openingNotes')
    .optional()
    .isString().withMessage('Opening notes must be a string'),
];

const closeSession = [
  param('id').isUUID().withMessage('Session ID must be a valid UUID'),
  body('actualCash')
    .optional()
    .isFloat({ min: 0 }).withMessage('Actual cash must be a non-negative number'),
  body('closingNotes')
    .optional()
    .isString().withMessage('Closing notes must be a string'),
];

module.exports = { openSession, closeSession };
