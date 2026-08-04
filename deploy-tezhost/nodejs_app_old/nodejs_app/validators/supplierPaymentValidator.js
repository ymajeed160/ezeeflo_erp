const { body, param, validationResult } = require('express-validator');

const validateCreate = [
  body('paymentDate').notEmpty().withMessage('Payment date is required').isDate().withMessage('Invalid date format'),
  body('supplierId').notEmpty().withMessage('Supplier is required').isUUID().withMessage('Invalid supplier'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required').isIn(['Cash', 'BankTransfer', 'Cheque']).withMessage('Invalid payment method'),
  body('amount').notEmpty().withMessage('Amount is required').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('referenceNumber').optional().isString(),
  body('bankAccount').optional().isString(),
  body('notes').optional().isString(),
  body('allocations').optional().isArray(),
  body('allocations.*.purchaseInvoiceId').optional().isUUID(),
  body('allocations.*.allocatedAmount').optional().isFloat({ min: 0 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

const validateUpdate = [
  param('id').isUUID().withMessage('Invalid ID'),
  body('paymentDate').optional().isDate().withMessage('Invalid date format'),
  body('supplierId').optional().isUUID().withMessage('Invalid supplier'),
  body('paymentMethod').optional().isIn(['Cash', 'BankTransfer', 'Cheque']).withMessage('Invalid payment method'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('referenceNumber').optional().isString(),
  body('bankAccount').optional().isString(),
  body('notes').optional().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];

module.exports = { validateCreate, validateUpdate };