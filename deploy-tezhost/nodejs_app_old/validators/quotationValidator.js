const { body, param, query, validationResult } = require('express-validator');

const quotationCreateRules = [
  body('customerId').notEmpty().withMessage('Customer is required'),
  body('quotationDate').notEmpty().withMessage('Quotation date is required').isDate().withMessage('Invalid date'),
  body('expiryDate').notEmpty().withMessage('Expiry date is required').isDate().withMessage('Invalid date'),
  body('warehouseId').optional(),
  body('reference').optional().isString(),
  body('notes').optional().isString(),
  body('termsConditions').optional().isString(),
  body('status').optional().isIn(['draft', 'sent', 'approved', 'rejected', 'converted']),
  body('details').isArray({ min: 1 }).withMessage('At least one detail line is required'),
  body('details.*.itemId').notEmpty().withMessage('Item is required for each line'),
  body('details.*.quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('details.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('details.*.taxPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('details.*.discountPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('details.*.description').optional().isString(),
];

const quotationUpdateRules = [
  body('customerId').optional().notEmpty().withMessage('Customer is required'),
  body('quotationDate').optional().notEmpty().withMessage('Quotation date is required').isDate().withMessage('Invalid date'),
  body('expiryDate').optional().notEmpty().withMessage('Expiry date is required').isDate().withMessage('Invalid date'),
  body('warehouseId').optional(),
  body('reference').optional().isString(),
  body('notes').optional().isString(),
  body('termsConditions').optional().isString(),
  body('status').optional().isIn(['draft', 'sent', 'approved', 'rejected', 'converted']),
  body('details').optional().isArray({ min: 1 }).withMessage('At least one detail line is required'),
  body('details.*.itemId').optional().notEmpty().withMessage('Item is required for each line'),
  body('details.*.quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('details.*.unitPrice').optional().isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('details.*.taxPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('details.*.discountPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('details.*.description').optional().isString(),
];

const statusUpdateRules = [
  param('id').isUUID().withMessage('Invalid quotation ID'),
  body('status').notEmpty().isIn(['sent', 'approved', 'rejected', 'converted']).withMessage('Invalid status'),
];

const quotationIdParam = [
  param('id').isUUID().withMessage('Invalid quotation ID'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  quotationCreateRules,
  quotationUpdateRules,
  statusUpdateRules,
  quotationIdParam,
  validate,
};