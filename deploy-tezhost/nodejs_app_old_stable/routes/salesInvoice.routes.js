'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const SalesInvoiceController = require('../controllers/SalesInvoiceController');
const salesInvoiceValidator = require('../validators/salesInvoiceValidator');
const { authenticate, authorize, tenancy } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/:tenantId/sales-invoices - List invoices (with pagination, filtering)
router.get(
  '/',
  authorize('salesinvoice.view'),
  salesInvoiceValidator.list,
  SalesInvoiceController.list
);

// POST /api/:tenantId/sales-invoices - Create invoice
router.post(
  '/',
  authorize('salesinvoice.create'),
  salesInvoiceValidator.create,
  SalesInvoiceController.create
);

// POST /api/:tenantId/sales-invoices/from-sales-order/:id - Generate from SO
router.post(
  '/from-sales-order/:id',
  authorize('salesinvoice.create'),
  SalesInvoiceController.generateFromSalesOrder
);

// POST /api/:tenantId/sales-invoices/from-delivery-note/:id - Generate from DN
router.post(
  '/from-delivery-note/:id',
  authorize('salesinvoice.create'),
  SalesInvoiceController.generateFromDeliveryNote
);

// GET /api/:tenantId/sales-invoices/for-allocation - Invoices for payment allocation
router.get(
  '/for-allocation',
  authorize('salesinvoice.view'),
  SalesInvoiceController.listForAllocation
);

// GET /api/:tenantId/sales-invoices/:id - Get invoice by ID
router.get(
  '/:id',
  authorize('salesinvoice.view'),
  salesInvoiceValidator.getById,
  SalesInvoiceController.getById
);

// PUT /api/:tenantId/sales-invoices/:id - Update invoice
router.put(
  '/:id',
  authorize('salesinvoice.edit'),
  salesInvoiceValidator.update,
  SalesInvoiceController.update
);

// DELETE /api/:tenantId/sales-invoices/:id - Delete invoice
router.delete(
  '/:id',
  authorize('salesinvoice.delete'),
  salesInvoiceValidator.delete,
  SalesInvoiceController.delete
);

// POST /api/:tenantId/sales-invoices/:id/post - Post invoice (accounting + inventory)
router.post(
  '/:id/post',
  authorize('salesinvoice.approve'),
  salesInvoiceValidator.post,
  SalesInvoiceController.post
);

// POST /api/:tenantId/sales-invoices/:id/cancel - Cancel invoice
router.post(
  '/:id/cancel',
  authorize('salesinvoice.approve'),
  salesInvoiceValidator.post,
  SalesInvoiceController.cancel
);

module.exports = router;