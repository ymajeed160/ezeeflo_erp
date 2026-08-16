'use strict';
const { body, param } = require('express-validator');

const completeSale = [
  body('terminalId')
    .notEmpty().withMessage('Terminal ID is required')
    .isUUID().withMessage('Terminal ID must be a valid UUID'),
  body('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .isUUID().withMessage('Session ID must be a valid UUID'),
  body('lines')
    .isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lines.*.itemId')
    .notEmpty().withMessage('Item ID is required for each line')
    .isUUID().withMessage('Item ID must be a valid UUID'),
  body('lines.*.quantity')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('lines.*.unitPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('payments')
    .isArray({ min: 1 }).withMessage('At least one payment method is required'),
  body('payments.*.paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['cash', 'card', 'bank_transfer', 'credit']).withMessage('Invalid payment method'),
  body('payments.*.amount')
    .isFloat({ min: 0 }).withMessage('Payment amount must be non-negative'),
];

const cancelSale = [
  param('id').isUUID().withMessage('Sale ID must be a valid UUID'),
  body('reason')
    .notEmpty().withMessage('Cancel reason is required')
    .isString().withMessage('Cancel reason must be a string'),
];

const holdOrder = [
  body('terminalId')
    .notEmpty().withMessage('Terminal ID is required')
    .isUUID().withMessage('Terminal ID must be a valid UUID'),
  body('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .isUUID().withMessage('Session ID must be a valid UUID'),
  body('cartData')
    .optional(),
];

module.exports = { completeSale, cancelSale, holdOrder };
