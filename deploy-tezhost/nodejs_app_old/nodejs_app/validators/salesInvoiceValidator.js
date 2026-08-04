'use strict';
const { body, param, query } = require('express-validator');

const salesInvoiceValidator = {
  create: [
    body('customerId')
      .notEmpty().withMessage('Customer is required')
      .isUUID().withMessage('Customer must be a valid ID'),
    body('warehouseId')
      .optional({ nullable: true })
      .isUUID().withMessage('Warehouse must be a valid ID'),
    body('invoiceDate')
      .notEmpty().withMessage('Invoice date is required')
      .isISO8601().withMessage('Invoice date must be a valid date'),
    body('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isISO8601().withMessage('Due date must be a valid date'),
    body('salesOrderId')
      .optional({ nullable: true })
      .isUUID().withMessage('Sales Order must be a valid ID'),
    body('deliveryNoteId')
      .optional({ nullable: true })
      .isUUID().withMessage('Delivery Note must be a valid ID'),
    body('reference')
      .optional({ nullable: true })
      .isLength({ max: 100 }).withMessage('Reference must be at most 100 characters'),
    body('notes')
      .optional({ nullable: true }),
    body('isInventoryImpact')
      .optional()
      .isBoolean().withMessage('Inventory impact must be true or false'),
    body('details')
      .isArray({ min: 1 }).withMessage('At least one invoice line is required'),
    body('details.*.itemId')
      .notEmpty().withMessage('Item is required for each line')
      .isUUID().withMessage('Item must be a valid ID'),
    body('details.*.quantity')
      .notEmpty().withMessage('Quantity is required for each line')
      .isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('details.*.unitPrice')
      .notEmpty().withMessage('Unit price is required for each line')
      .isFloat({ min: 0 }).withMessage('Unit price must be 0 or greater'),
    body('details.*.taxPercent')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Tax % must be between 0 and 100'),
    body('details.*.discountPercent')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Discount % must be between 0 and 100'),
    body('customerAccountId')
      .optional({ nullable: true })
      .isUUID().withMessage('Customer account must be a valid ID'),
    body('revenueAccountId')
      .optional({ nullable: true })
      .isUUID().withMessage('Revenue account must be a valid ID'),
    body('taxAccountId')
      .optional({ nullable: true })
      .isUUID().withMessage('Tax account must be a valid ID'),
  ],

  update: [
    param('id')
      .isUUID().withMessage('Invoice ID must be a valid ID'),
    body('customerId')
      .notEmpty().withMessage('Customer is required')
      .isUUID().withMessage('Customer must be a valid ID'),
    body('warehouseId')
      .optional({ nullable: true })
      .isUUID().withMessage('Warehouse must be a valid ID'),
    body('invoiceDate')
      .notEmpty().withMessage('Invoice date is required')
      .isISO8601().withMessage('Invoice date must be a valid date'),
    body('dueDate')
      .notEmpty().withMessage('Due date is required')
      .isISO8601().withMessage('Due date must be a valid date'),
    body('salesOrderId')
      .optional({ nullable: true })
      .isUUID().withMessage('Sales Order must be a valid ID'),
    body('deliveryNoteId')
      .optional({ nullable: true })
      .isUUID().withMessage('Delivery Note must be a valid ID'),
    body('reference')
      .optional({ nullable: true })
      .isLength({ max: 100 }).withMessage('Reference must be at most 100 characters'),
    body('notes')
      .optional({ nullable: true }),
    body('isInventoryImpact')
      .optional()
      .isBoolean().withMessage('Inventory impact must be true or false'),
    body('customerAccountId')
      .optional({ nullable: true })
      .isUUID().withMessage('Customer account must be a valid ID'),
    body('revenueAccountId')
      .optional({ nullable: true })
      .isUUID().withMessage('Revenue account must be a valid ID'),
    body('taxAccountId')
      .optional({ nullable: true })
      .isUUID().withMessage('Tax account must be a valid ID'),
    body('details')
      .isArray({ min: 1 }).withMessage('At least one invoice line is required'),
    body('details.*.itemId')
      .notEmpty().withMessage('Item is required for each line')
      .isUUID().withMessage('Item must be a valid ID'),
    body('details.*.quantity')
      .notEmpty().withMessage('Quantity is required for each line')
      .isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('details.*.unitPrice')
      .notEmpty().withMessage('Unit price is required for each line')
      .isFloat({ min: 0 }).withMessage('Unit price must be 0 or greater'),
    body('details.*.taxPercent')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Tax % must be between 0 and 100'),
    body('details.*.discountPercent')
      .optional()
      .isFloat({ min: 0, max: 100 }).withMessage('Discount % must be between 0 and 100'),
  ],

  getById: [
    param('id')
      .isUUID().withMessage('Invoice ID must be a valid ID'),
  ],

  delete: [
    param('id')
      .isUUID().withMessage('Invoice ID must be a valid ID'),
  ],

  post: [
    param('id')
      .isUUID().withMessage('Invoice ID must be a valid ID'),
  ],

  list: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional({ values: 'falsy' })
      .isIn(['draft', 'posted', 'paid', 'partially_paid', 'overdue', 'cancelled'])
      .withMessage('Invalid status'),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('End date must be a valid date'),
    query('search')
      .optional()
      .isLength({ max: 255 }).withMessage('Search term too long'),
  ],
};

module.exports = salesInvoiceValidator;