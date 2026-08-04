'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const CustomerPaymentController = require('../controllers/CustomerPaymentController');
const customerPaymentValidator = require('../validators/customerPaymentValidator');
const { authenticate, authorize, tenancy } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/:tenantId/customer-payments - List customer payments (with pagination, filtering)
router.get(
  '/',
  authorize('customerpayment.view'),
  CustomerPaymentController.list
);

// POST /api/:tenantId/customer-payments - Create customer payment
router.post(
  '/',
  authorize('customerpayment.create'),
  customerPaymentValidator.create,
  CustomerPaymentController.create
);

// GET /api/:tenantId/customer-payments/:id - Get customer payment by ID
router.get(
  '/:id',
  authorize('customerpayment.view'),
  customerPaymentValidator.idParam,
  CustomerPaymentController.getById
);

// PUT /api/:tenantId/customer-payments/:id - Update customer payment
router.put(
  '/:id',
  authorize('customerpayment.edit'),
  customerPaymentValidator.update,
  CustomerPaymentController.update
);

// DELETE /api/:tenantId/customer-payments/:id - Delete customer payment
router.delete(
  '/:id',
  authorize('customerpayment.delete'),
  customerPaymentValidator.idParam,
  CustomerPaymentController.delete
);

// POST /api/:tenantId/customer-payments/:id/post - Post customer payment (accounting)
router.post(
  '/:id/post',
  authorize('customerpayment.post'),
  customerPaymentValidator.idParam,
  CustomerPaymentController.post
);

// POST /api/:tenantId/customer-payments/:id/cancel - Cancel customer payment
router.post(
  '/:id/cancel',
  authorize('customerpayment.cancel'),
  customerPaymentValidator.idParam,
  CustomerPaymentController.cancel
);

module.exports = router;