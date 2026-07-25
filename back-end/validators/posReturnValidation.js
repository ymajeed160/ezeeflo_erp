'use strict';
const { body, param } = require('express-validator');

const processReturn = [
  body('originalSaleId')
    .notEmpty().withMessage('Original sale ID is required')
    .isUUID().withMessage('Original sale ID must be a valid UUID'),
  body('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .isUUID().withMessage('Session ID must be a valid UUID'),
  body('items')
    .isArray({ min: 1 }).withMessage('At least one return item is required'),
  body('items.*.originalSaleLineId')
    .notEmpty().withMessage('Original sale line ID is required')
    .isUUID().withMessage('Original sale line ID must be a valid UUID'),
  body('items.*.quantity')
    .isFloat({ min: 0.01 }).withMessage('Return quantity must be greater than 0'),
  body('refundMethod')
    .optional()
    .isIn(['cash', 'card', 'account_credit']).withMessage('Invalid refund method'),
];

module.exports = { processReturn };
