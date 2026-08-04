const express = require('express');
const router = express.Router();
const stockAdjustmentController = require('../controllers/StockAdjustmentController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createStockAdjustmentValidation,
  adjustmentIdValidation,
} = require('../validators/stockAdjustmentValidation');

// All routes require authentication and tenant context
router.use(authMiddleware);

// GET /api/stock-adjustments - Get all stock adjustments with pagination
router.get(
  '/',
  requirePermission('stockadjustment.view'),
  (req, res, next) => stockAdjustmentController.getAdjustments(req, res, next)
);

// GET /api/stock-adjustments/:id - Get stock adjustment by ID
router.get(
  '/:id',
  requirePermission('stockadjustment.view'),
  adjustmentIdValidation,
  (req, res, next) => stockAdjustmentController.getAdjustmentById(req, res, next)
);

// POST /api/stock-adjustments - Create a new stock adjustment
router.post(
  '/',
  requirePermission('stockadjustment.create'),
  createStockAdjustmentValidation,
  (req, res, next) => stockAdjustmentController.createAdjustment(req, res, next)
);

// PATCH /api/stock-adjustments/:id/status - Update adjustment status (approve)
router.patch(
  '/:id/status',
  requirePermission('stockadjustment.approve'),
  adjustmentIdValidation,
  (req, res, next) => stockAdjustmentController.updateAdjustmentStatus(req, res, next)
);

module.exports = router;