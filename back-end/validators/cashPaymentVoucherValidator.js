'use strict';
const { body, query, param } = require('express-validator');

const cashPaymentVoucherValidator = {
  create: [
    body('voucherDate').notEmpty().withMessage('Voucher date is required').isDate(),
    body('cashAccountId').notEmpty().isUUID().withMessage('Cash account is required'),
    body('payeeType').optional().isIn(['supplier', 'employee', 'customer', 'other']),
    body('payeeName').optional().isString(),
    body('description').optional().isString(),
    body('lines').isArray({ min: 1 }).withMessage('At least one line is required'),
    body('lines.*.accountId').notEmpty().isUUID().withMessage('Account is required for each line'),
    body('lines.*.amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('lines.*.description').optional().isString(),
  ],

  update: [
    param('id').isUUID(),
    body('voucherDate').optional().isDate(),
    body('cashAccountId').optional().isUUID(),
    body('lines').optional().isArray({ min: 1 }),
    body('lines.*.accountId').optional().isUUID(),
    body('lines.*.amount').optional().isFloat({ gt: 0 }),
  ],

  idParam: [param('id').isUUID().withMessage('Invalid voucher ID')],

  list: [
    query('status').optional().isString(),
    query('startDate').optional().isDate(),
    query('endDate').optional().isDate(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
};

module.exports = cashPaymentVoucherValidator;
