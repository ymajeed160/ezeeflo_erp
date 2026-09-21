'use strict';
const { body, param } = require('express-validator');

const createTerminal = [
  body('terminalName')
    .notEmpty().withMessage('Terminal name is required')
    .isString().withMessage('Terminal name must be a string')
    .isLength({ max: 200 }).withMessage('Terminal name must be at most 200 characters'),
  body('terminalCode')
    .notEmpty().withMessage('Terminal code is required')
    .isString().withMessage('Terminal code must be a string')
    .isLength({ max: 50 }).withMessage('Terminal code must be at most 50 characters'),
  body('warehouseId')
    .optional()
    .isUUID().withMessage('Warehouse ID must be a valid UUID'),
  body('defaultCashAccountId')
    .optional()
    .isUUID().withMessage('Cash account ID must be a valid UUID'),
  body('defaultBankAccountId')
    .optional()
    .isUUID().withMessage('Bank account ID must be a valid UUID'),
];

const updateTerminal = [
  param('id').isUUID().withMessage('Terminal ID must be a valid UUID'),
  body('terminalName')
    .optional()
    .isString().withMessage('Terminal name must be a string')
    .isLength({ max: 200 }).withMessage('Terminal name must be at most 200 characters'),
  body('terminalCode')
    .optional()
    .isString().withMessage('Terminal code must be a string')
    .isLength({ max: 50 }).withMessage('Terminal code must be at most 50 characters'),
];

const terminalIdParam = [
  param('id').isUUID().withMessage('Terminal ID must be a valid UUID'),
];

module.exports = { createTerminal, updateTerminal, terminalIdParam };
