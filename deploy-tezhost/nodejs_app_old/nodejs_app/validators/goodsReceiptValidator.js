'use strict';
const { body, param } = require('express-validator');

exports.createGoodsReceipt = [
  body('purchaseOrderId').optional({ nullable: true }).isUUID().withMessage('Valid Purchase Order ID is required'),
  body('supplierId').optional({ nullable: true }).isUUID().withMessage('Valid Supplier ID is required'),
  body('receiptDate').notEmpty().withMessage('Receipt date is required'),
  body('warehouseId').optional({ nullable: true }).isUUID().withMessage('Valid Warehouse ID is required'),
  body('details').isArray({ min: 1 }).withMessage('At least one detail line is required'),
  body('details.*.itemId').isUUID().withMessage('Item is required'),
  body('details.*.orderedQuantity').isFloat({ min: 0 }).withMessage('Ordered qty must be >= 0'),
  body('details.*.receivedQuantity').isFloat({ min: 0 }).withMessage('Received qty must be >= 0'),
  body('details.*.unitPrice').optional().isFloat({ min: 0 }),
  body('details.*.taxPercentage').optional().isFloat({ min: 0, max: 100 }),
  body('details.*.discountPercentage').optional().isFloat({ min: 0, max: 100 }),
];

exports.updateGoodsReceipt = [
  param('id').isUUID().withMessage('Valid ID is required'),
  body('receiptDate').optional().notEmpty(),
  body('warehouseId').optional({ nullable: true }).isUUID().withMessage('Valid Warehouse ID is required'),
  body('details').optional().isArray({ min: 1 }),
  body('details.*.itemId').optional().isUUID().withMessage('Valid Item ID is required'),
  body('details.*.receivedQuantity').optional().isFloat({ min: 0 }),
];

exports.approveGoodsReceipt = [
  param('id').isUUID().withMessage('Valid ID is required'),
];