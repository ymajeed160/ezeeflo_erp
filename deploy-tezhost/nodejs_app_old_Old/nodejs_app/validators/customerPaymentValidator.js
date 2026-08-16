'use strict';

const { body, param, validationResult } = require('express-validator');
const ApiResponse = require('../utils/apiResponse');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((e) => e.msg);
    return ApiResponse.badRequest(res, {
      message: 'Validation failed',
      errors: extractedErrors,
    });
  }
  next();
};

const customerPaymentValidation = {
  create: [
    body('paymentNumber')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 30 })
      .withMessage('Payment number must be at most 30 characters'),
    body('customerId').isUUID().withMessage('Valid customer ID is required'),
    body('paymentDate')
      .notEmpty()
      .withMessage('Payment date is required')
      .isDate()
      .withMessage('Invalid payment date format'),
    body('paymentMethod')
      .optional()
      .isIn(['cash', 'bank_transfer', 'cheque', 'credit_card', 'other'])
      .withMessage('Payment method must be cash, bank_transfer, cheque, credit_card, or other'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be 0 or greater'),
    body('reference')
      .optional({ checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Reference must be at most 100 characters'),
    body('bankAccountId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Valid bank account ID is required'),
    body('paymentAccountId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Valid payment account ID is required'),
    body('customerAccountId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Valid customer account ID is required'),
    body('notes').optional({ checkFalsy: true }).isString().withMessage('Notes must be a string'),
    body('status')
      .optional()
      .isIn(['draft', 'posted', 'cancelled'])
      .withMessage('Status must be draft, posted, or cancelled'),
    body('allocations')
      .optional()
      .isArray()
      .withMessage('Allocations must be an array'),
    body('allocations.*.salesInvoiceId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Valid sales invoice ID is required in allocations'),
    body('allocations.*.allocatedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Allocated amount must be 0 or greater in allocations'),
    handleValidationErrors,
  ],

  update: [
    param('id').isUUID().withMessage('Valid payment ID is required'),
    body('customerId').isUUID().withMessage('Valid customer ID is required'),
    body('paymentDate')
      .notEmpty()
      .withMessage('Payment date is required')
      .isDate()
      .withMessage('Invalid payment date format'),
    body('paymentMethod')
      .optional()
      .isIn(['cash', 'bank_transfer', 'cheque', 'credit_card', 'other'])
      .withMessage('Payment method must be cash, bank_transfer, cheque, credit_card, or other'),
    body('amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Amount must be 0 or greater'),
    body('reference')
      .optional({ checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Reference must be at most 100 characters'),
    body('bankAccountId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Valid bank account ID is required'),
    body('paymentAccountId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Valid payment account ID is required'),
    body('customerAccountId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Valid customer account ID is required'),
    body('notes').optional({ checkFalsy: true }).isString().withMessage('Notes must be a string'),
    body('allocations')
      .optional()
      .isArray()
      .withMessage('Allocations must be an array'),
    body('allocations.*.salesInvoiceId')
      .optional({ nullable: true })
      .isUUID()
      .withMessage('Valid sales invoice ID is required in allocations'),
    body('allocations.*.allocatedAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Allocated amount must be 0 or greater in allocations'),
    handleValidationErrors,
  ],

  idParam: [
    param('id').isUUID().withMessage('Valid payment ID is required'),
    handleValidationErrors,
  ],

  updateStatus: [
    param('id').isUUID().withMessage('Valid payment ID is required'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['posted', 'cancelled'])
      .withMessage('Status must be posted or cancelled'),
    handleValidationErrors,
  ],
};

module.exports = customerPaymentValidation;