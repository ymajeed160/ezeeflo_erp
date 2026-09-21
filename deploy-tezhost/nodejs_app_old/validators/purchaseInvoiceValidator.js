'use strict';

const { body, param, query, validationResult } = require('express-validator');

const purchaseInvoiceValidation = {
  create: [
    body('supplierId').isUUID().withMessage('Supplier is required'),
    body('invoiceDate').notEmpty().withMessage('Invoice date is required'),
    body('supplierInvoiceNumber').optional({ nullable: true }).trim(),
    body('dueDate').optional({ nullable: true }),
    body('warehouseId').optional({ nullable: true }).isUUID(),
    body('notes').optional({ nullable: true }).trim(),
    body('details').optional().isArray({ min: 1 }),
    body('details.*.itemId').optional().isUUID(),
    body('details.*.quantity').optional().isFloat({ min: 0.0001 }),
    body('details.*.unitCost').optional().isFloat({ min: 0 }),
    body('details.*.taxPercent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
    body('details.*.discountPercent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
    body('details.*.description').optional({ nullable: true }).trim(),
    // Also accept 'items' as alias for 'details'
    body('items').optional().isArray({ min: 1 }),
    body('items.*.itemId').optional().isUUID(),
    body('items.*.quantity').optional().isFloat({ min: 0.0001 }),
    body('items.*.unitCost').optional().isFloat({ min: 0 }),
    body('items.*.taxPercent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
    body('items.*.discountPercent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
    body('items.*.description').optional({ nullable: true }).trim(),
  ],

  update: [
    param('id').isUUID().withMessage('Valid ID is required'),
    body('supplierId').optional().isUUID(),
    body('invoiceDate').optional().notEmpty(),
    body('supplierInvoiceNumber').optional({ nullable: true }).trim(),
    body('dueDate').optional({ nullable: true }),
    body('warehouseId').optional({ nullable: true }).isUUID(),
    body('notes').optional({ nullable: true }).trim(),
    body('details').optional().isArray({ min: 1 }),
    body('details.*.itemId').optional().isUUID(),
    body('details.*.quantity').optional().isFloat({ min: 0.0001 }),
    body('details.*.unitCost').optional().isFloat({ min: 0 }),
    body('details.*.taxPercent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
    body('details.*.discountPercent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
    body('items').optional().isArray({ min: 1 }),
    body('items.*.itemId').optional().isUUID(),
    body('items.*.quantity').optional().isFloat({ min: 0.0001 }),
    body('items.*.unitCost').optional().isFloat({ min: 0 }),
    body('items.*.taxPercent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
    body('items.*.discountPercent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }),
  ],

  getById: [
    param('id').isUUID().withMessage('Valid ID is required'),
  ],

  approve: [
    param('id').isUUID().withMessage('Valid ID is required'),
  ],

  cancel: [
    param('id').isUUID().withMessage('Valid ID is required'),
  ],

  list: [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 999 }).toInt(),
    query('search').optional().trim(),
    query('status').optional().trim(),
    query('supplierId').optional(),
  ],

  validate: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  },
};

module.exports = purchaseInvoiceValidation;