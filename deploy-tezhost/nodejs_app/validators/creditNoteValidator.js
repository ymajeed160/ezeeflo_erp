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

const creditNoteValidation = {
  create: [
    body('creditNoteNumber')
      .trim()
      .notEmpty()
      .withMessage('Credit note number is required')
      .isLength({ max: 30 })
      .withMessage('Credit note number must be at most 30 characters'),
    body('customerId').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
    body('salesReturnId').isInt({ min: 1 }).withMessage('Valid sales return ID is required'),
    body('warehouseId').isInt({ min: 1 }).withMessage('Valid warehouse ID is required'),
    body('creditNoteDate')
      .notEmpty()
      .withMessage('Credit note date is required')
      .isDate()
      .withMessage('Invalid credit note date format'),
    body('salesInvoiceId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Valid sales invoice ID is required'),
    body('reference')
      .optional({ checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Reference must be at most 100 characters'),
    body('notes').optional({ checkFalsy: true }).isString().withMessage('Notes must be a string'),
    body('status')
      .optional()
      .isIn(['draft', 'posted', 'cancelled'])
      .withMessage('Status must be draft, posted, or cancelled'),
    body('isInventoryImpact')
      .optional()
      .isBoolean()
      .withMessage('isInventoryImpact must be a boolean'),
    body('details').isArray({ min: 1 }).withMessage('At least one credit note detail line is required'),
    body('details.*.itemId').isInt({ min: 1 }).withMessage('Valid item ID is required in details'),
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
    param('id').isInt({ min: 1 }).withMessage('Valid credit note ID is required'),
    body('customerId').isInt({ min: 1 }).withMessage('Valid customer ID is required'),
    body('salesReturnId').isInt({ min: 1 }).withMessage('Valid sales return ID is required'),
    body('warehouseId').isInt({ min: 1 }).withMessage('Valid warehouse ID is required'),
    body('creditNoteDate')
      .notEmpty()
      .withMessage('Credit note date is required')
      .isDate()
      .withMessage('Invalid credit note date format'),
    body('salesInvoiceId')
      .optional({ checkFalsy: true })
      .isInt({ min: 1 })
      .withMessage('Valid sales invoice ID is required'),
    body('reference')
      .optional({ checkFalsy: true })
      .isLength({ max: 100 })
      .withMessage('Reference must be at most 100 characters'),
    body('notes').optional({ checkFalsy: true }).isString().withMessage('Notes must be a string'),
    body('isInventoryImpact')
      .optional()
      .isBoolean()
      .withMessage('isInventoryImpact must be a boolean'),
    body('details').isArray({ min: 1 }).withMessage('At least one credit note detail line is required'),
    body('details.*.itemId').isInt({ min: 1 }).withMessage('Valid item ID is required in details'),
    body('details.*.quantity')
      .isFloat({ gt: 0 })
      .withMessage('Quantity must be greater than 0 in details'),
    body('details.*.unitPrice')
      .isFloat({ min: 0 })
      .withMessage('Unit price must be 0 or greater in details'),
    handleValidationErrors,
  ],

  idParam: [
    param('id').isInt({ min: 1 }).withMessage('Valid credit note ID is required'),
    handleValidationErrors,
  ],

  updateStatus: [
    param('id').isInt({ min: 1 }).withMessage('Valid credit note ID is required'),
    body('status')
      .notEmpty()
      .withMessage('Status is required')
      .isIn(['posted', 'cancelled'])
      .withMessage('Status must be posted or cancelled'),
    handleValidationErrors,
  ],
};

module.exports = creditNoteValidation;