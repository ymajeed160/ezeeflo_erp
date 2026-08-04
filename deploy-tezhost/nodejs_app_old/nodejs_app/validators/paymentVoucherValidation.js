const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const paymentVoucherIdValidation = [
  param('id').notEmpty().withMessage('Voucher ID is required').isUUID(4).withMessage('Invalid voucher ID format'),
  handleValidationErrors,
];

const createPaymentVoucherValidation = [
  body('voucherDate').notEmpty().withMessage('Voucher date is required').isISO8601().withMessage('Invalid date format'),
  body('bankAccountId').notEmpty().withMessage('Bank account is required').isUUID(4).withMessage('Invalid bank account ID'),
  body('paymentMethod').notEmpty().isIn(['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other']).withMessage('Invalid payment method'),
  body('amount').notEmpty().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentPurpose').optional().isIn(['Supplier Payment', 'Direct Expense', 'Advance Payment', 'Other']).withMessage('Invalid payment purpose'),
  body('supplierId').optional({ nullable: true }).isUUID(4).withMessage('Invalid supplier ID'),
  body('paidTo').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('referenceNumber').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 1000 }),
  body('allocations').optional({ nullable: true }).isArray(),
  body('allocations.*.purchaseInvoiceId').optional().isUUID(4),
  body('allocations.*.allocatedAmount').optional().isFloat({ min: 0 }),
  body('lines').optional({ nullable: true }).isArray(),
  body('lines.*.accountId').optional().isUUID(4),
  body('lines.*.amount').optional().isFloat({ min: 0 }),
  body('lines.*.description').optional().trim(),
  body('lines.*.taxPercentage').optional().isFloat({ min: 0 }),
  body('lines.*.taxAccountId').optional({ nullable: true }).isUUID(4),
  handleValidationErrors,
];

module.exports = { paymentVoucherIdValidation, createPaymentVoucherValidation };
