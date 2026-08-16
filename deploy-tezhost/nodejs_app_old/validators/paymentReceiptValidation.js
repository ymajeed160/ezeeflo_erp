const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const paymentReceiptIdValidation = [
  param('id').notEmpty().withMessage('Receipt ID is required').isUUID(4).withMessage('Invalid receipt ID format'),
  handleValidationErrors,
];

const createPaymentReceiptValidation = [
  body('receiptDate')
    .notEmpty().withMessage('Receipt date is required')
    .isISO8601().withMessage('Invalid receipt date format'),
  body('bankAccountId')
    .notEmpty().withMessage('Bank account is required')
    .isUUID(4).withMessage('Invalid bank account ID format'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Online Payment', 'Other'])
    .withMessage('Invalid payment method'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currencyCode')
    .optional().trim().isLength({ min: 3, max: 10 }).withMessage('Invalid currency code'),
  body('exchangeRate')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Exchange rate must be positive'),
  body('customerId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid customer ID format'),
  body('receivedFrom')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Received from must not exceed 200 characters'),
  body('referenceNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Reference number must not exceed 100 characters'),
  body('depositReference')
    .optional({ nullable: true }).trim()
    .isLength({ max: 100 }).withMessage('Deposit reference must not exceed 100 characters'),
  body('notes')
    .optional({ nullable: true }).trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
  body('allocations')
    .optional({ nullable: true })
    .isArray().withMessage('Allocations must be an array'),
  body('allocations.*.salesInvoiceId')
    .optional()
    .isUUID(4).withMessage('Invalid sales invoice ID format'),
  body('allocations.*.allocatedAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Allocated amount must be non-negative'),
  handleValidationErrors,
];

module.exports = {
  paymentReceiptIdValidation,
  createPaymentReceiptValidation,
};
