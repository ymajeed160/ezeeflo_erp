'use strict';

const { body, param, query, validationResult } = require('express-validator');

/**
 * Delivery note detail validation
 */
const deliveryNoteDetailValidation = [
  body('itemId').isUUID().withMessage('Item is required'),
  body('description').optional({ nullable: true }).isString().trim(),
  body('quantity')
    .isFloat({ min: 0.0001 })
    .withMessage('Quantity must be greater than 0'),
  body('unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be 0 or greater'),
  body('taxPercentage')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax % must be between 0 and 100'),
  body('discountPercentage')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount % must be between 0 and 100'),
  body('salesOrderDetailId').optional({ nullable: true }).isUUID(),
];

/**
 * Create delivery note validation
 */
const validateCreate = [
  body('salesOrderId').optional({ nullable: true }).isUUID().withMessage('Invalid sales order'),
  body('customerId')
    .isUUID()
    .withMessage('Customer is required'),
  body('warehouseId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Invalid warehouse'),
  body('deliveryDate')
    .notEmpty()
    .withMessage('Delivery date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('reference').optional({ nullable: true }).isString().trim(),
  body('notes').optional({ nullable: true }).isString().trim(),
  body('details')
    .isArray({ min: 1 })
    .withMessage('At least one line item is required'),
  body('details.*.itemId').isUUID().withMessage('Item is required for each line'),
  body('details.*.quantity')
    .isFloat({ min: 0.0001 })
    .withMessage('Quantity must be greater than 0'),
  body('details.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be 0 or greater'),
  body('details.*.taxPercentage')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 }),
  body('details.*.discountPercentage')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 100 }),
  body('details.*.salesOrderDetailId').optional({ nullable: true }).isUUID(),
];

/**
 * Generate from sales order validation
 */
const validateGenerateFromSO = [
  body('salesOrderId')
    .isUUID()
    .withMessage('Sales order is required'),
  body('warehouseId')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('Invalid warehouse'),
  body('deliveryDate')
    .notEmpty()
    .withMessage('Delivery date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('reference').optional({ nullable: true }).isString().trim(),
  body('notes').optional({ nullable: true }).isString().trim(),
  body('details')
    .isArray({ min: 1 })
    .withMessage('At least one line item is required'),
  body('details.*.salesOrderDetailId').isUUID().withMessage('Sales order detail ID is required'),
  body('details.*.itemId').isUUID().withMessage('Item is required'),
  body('details.*.quantity')
    .isFloat({ min: 0.0001 })
    .withMessage('Quantity must be greater than 0'),
];

/**
 * Update delivery note validation
 */
const validateUpdate = [
  param('id').isUUID().withMessage('Invalid delivery note ID'),
  body('salesOrderId').optional({ nullable: true }).isUUID().withMessage('Invalid sales order'),
  body('customerId')
    .optional()
    .isUUID()
    .withMessage('Customer is required'),
  body('warehouseId')
    .optional()
    .isUUID()
    .withMessage('Warehouse is required'),
  body('deliveryDate')
    .optional()
    .notEmpty()
    .withMessage('Delivery date is required')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('reference').optional({ nullable: true }).isString().trim(),
  body('notes').optional({ nullable: true }).isString().trim(),
  body('details')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one line item is required'),
  body('details.*.itemId').isUUID().withMessage('Item is required for each line'),
  body('details.*.quantity')
    .isFloat({ min: 0.0001 })
    .withMessage('Quantity must be greater than 0'),
  body('details.*.unitPrice')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be 0 or greater'),
];

/**
 * Status update validation
 */
const validateStatusUpdate = [
  param('id').isUUID().withMessage('Invalid delivery note ID'),
  body('status')
    .isIn(['draft', 'delivered', 'cancelled'])
    .withMessage('Status must be draft, delivered, or cancelled'),
];

/**
 * Query params validation for list
 */
const validateList = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isString().trim(),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  query('search').optional().isString().trim(),
  query('status').optional().isString().trim(),
];

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateCreate,
  validateUpdate,
  validateGenerateFromSO,
  validateStatusUpdate,
  validateList,
  handleValidation,
};