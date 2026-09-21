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

const salesReturnValidation = {
  create: [
    body('returnNumber')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 30 })
      .withMessage('Return number must be at most 30 characters'),
    body('customerId').isUUID().withMessage('Valid customer ID is required'),
    body('salesInvoiceId').optional({ nullable: true }).isUUID().withMessage('Valid sales invoice ID is required'),
    body('warehouseId').optional({ nullable: true }).isUUID().withMessage('Valid warehouse ID is required'),
    body('returnDate')
      .notEmpty()
      .withMessage('Return date is required')
      .isDate()
      .withMessage('Invalid return date format'),
    body('reference')
      .optional({ checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Reference must be at most 100 characters'),
    body('notes').optional({ checkFalsy: true }).isString().withMessage('Notes must be a string'),
    body('status')
      .optional()
      .isIn(['draft', 'approved', 'rejected'])
      .withMessage('Status must be draft, approved, or rejected'),
    body('isInventoryImpact')
      .optional()
      .isBoolean()
      .withMessage('isInventoryImpact must be a boolean'),
    body('details').isArray({ min: 1 }).withMessage('At least one return detail line is required'),
    body('details.*.itemId').isUUID().withMessage('Valid item ID is required in details'),
    body('details.*.quantity')
      .isFloat({ gt: 0 })
      .withMessage('Quantity must be greater than 0 in details'),
    body('details.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be 0 or greater in details'),
    body('details.*.taxPercent')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Tax percent must be 0 or greater in details'),
    body('details.*.discountPercent')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Discount percent must be 0 or greater in details'),
    handleValidationErrors,
  ],

  update: [
    param('id').isUUID().withMessage('Valid sales return ID is required'),
    body('customerId').isUUID().withMessage('Valid customer ID is required'),
    body('salesInvoiceId').optional({ nullable: true }).isUUID().withMessage('Valid sales invoice ID is required'),
    body('warehouseId').optional({ nullable: true }).isUUID().withMessage('Valid warehouse ID is required'),
    body('returnDate')
      .notEmpty()
      .withMessage('Return date is required')
      .isDate()
      .withMessage('Invalid return date format'),
    body('reference')
      .optional({ checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Reference must be at most 100 characters'),
    body('notes').optional({ checkFalsy: true }).isString().withMessage('Notes must be a string'),
    body('isInventoryImpact')
      .optional()
      .isBoolean()
      .withMessage('isInventoryImpact must be a boolean'),
    body('details').isArray({ min: 1 }).withMessage('At least one return detail line is required'),
    body('details.*.itemId').isUUID().withMessage('Valid item ID is required in details'),
    body('details.*.quantity')
      .isFloat({ gt: 0 })
      .withMessage('Quantity must be greater than 0 in details'),
    body('details.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be 0 or greater in details'),
    handleValidationErrors,
  ],

  idParam: [
    param('id').isUUID().withMessage('Valid sales return ID is required'),
    handleValidationErrors,
  ],

  updateStatus: [
    param('id').isUUID().withMessage('Valid sales return ID is required'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['approved', 'rejected'])
      .withMessage('Status must be approved or rejected'),
    handleValidationErrors,
  ],
};

module.exports = salesReturnValidation;