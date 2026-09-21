'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const DeliveryNoteController = require('../controllers/DeliveryNoteController');
const {
  validateCreate,
  validateUpdate,
  validateGenerateFromSO,
  validateStatusUpdate,
  validateList,
  handleValidation,
} = require('../validators/deliveryNoteValidator');
const { authenticate, checkPermission } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// List delivery notes
router.get(
  '/',
  checkPermission('deliverynote.view'),
  validateList,
  handleValidation,
  DeliveryNoteController.list
);

// Get next delivery number
router.get(
  '/next-number',
  checkPermission('deliverynote.view'),
  DeliveryNoteController.getNextNumber
);

// Get deliveries by sales order
router.get(
  '/by-sales-order/:salesOrderId',
  checkPermission('deliverynote.view'),
  DeliveryNoteController.getBySalesOrder
);

// Get delivery note by ID
router.get(
  '/:id',
  checkPermission('deliverynote.view'),
  DeliveryNoteController.getById
);

// Create delivery note
router.post(
  '/',
  checkPermission('deliverynote.create'),
  validateCreate,
  handleValidation,
  DeliveryNoteController.create
);

// Generate delivery note from sales order
router.post(
  '/generate-from-sales-order',
  checkPermission('deliverynote.create'),
  validateGenerateFromSO,
  handleValidation,
  DeliveryNoteController.generateFromSalesOrder
);

// Update delivery note
router.put(
  '/:id',
  checkPermission('deliverynote.edit'),
  validateUpdate,
  handleValidation,
  DeliveryNoteController.update
);

// Delete delivery note
router.delete(
  '/:id',
  checkPermission('deliverynote.delete'),
  DeliveryNoteController.delete
);

// Update delivery note status
router.patch(
  '/:id/status',
  checkPermission('deliverynote.approve'),
  validateStatusUpdate,
  handleValidation,
  DeliveryNoteController.updateStatus
);

module.exports = router;