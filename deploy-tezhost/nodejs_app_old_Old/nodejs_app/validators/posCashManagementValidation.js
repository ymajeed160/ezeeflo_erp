'use strict';
const { body } = require('express-validator');

const recordMovement = [
  body('terminalId')
    .notEmpty().withMessage('Terminal ID is required')
    .isUUID().withMessage('Terminal ID must be a valid UUID'),
  body('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .isUUID().withMessage('Session ID must be a valid UUID'),
  body('movementType')
    .notEmpty().withMessage('Movement type is required')
    .isIn(['cash_in', 'cash_out', 'adjustment', 'transfer']).withMessage('Invalid movement type'),
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('reason')
    .notEmpty().withMessage('Reason is required')
    .isString().withMessage('Reason must be a string'),
];

module.exports = { recordMovement };
