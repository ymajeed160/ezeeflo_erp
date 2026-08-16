'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const SalesReturnController = require('../controllers/SalesReturnController');
const salesReturnValidator = require('../validators/salesReturnValidator');
const { authenticate, authorize, tenancy } = require('../middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/:tenantId/sales-returns - List returns (with pagination, filtering)
router.get(
  '/',
  authorize('salesreturn.view'),
  SalesReturnController.list
);

// POST /api/:tenantId/sales-returns - Create return
router.post(
  '/',
  authorize('salesreturn.create'),
  salesReturnValidator.create,
  SalesReturnController.create
);

// GET /api/:tenantId/sales-returns/:id - Get return by ID
router.get(
  '/:id',
  authorize('salesreturn.view'),
  salesReturnValidator.idParam,
  SalesReturnController.getById
);

// PUT /api/:tenantId/sales-returns/:id - Update return
router.put(
  '/:id',
  authorize('salesreturn.edit'),
  salesReturnValidator.update,
  SalesReturnController.update
);

// DELETE /api/:tenantId/sales-returns/:id - Delete return
router.delete(
  '/:id',
  authorize('salesreturn.delete'),
  salesReturnValidator.idParam,
  SalesReturnController.delete
);

// POST /api/:tenantId/sales-returns/:id/post - Post return (accounting + inventory with account selection)
router.post(
  '/:id/post',
  authorize('salesreturn.approve'),
  SalesReturnController.post
);

// POST /api/:tenantId/sales-returns/:id/approve - Approve return (accounting + inventory)
router.post(
  '/:id/approve',
  authorize('salesreturn.approve'),
  salesReturnValidator.idParam,
  SalesReturnController.approve
);

// POST /api/:tenantId/sales-returns/:id/reject - Reject return
router.post(
  '/:id/reject',
  authorize('salesreturn.approve'),
  salesReturnValidator.idParam,
  SalesReturnController.reject
);

module.exports = router;