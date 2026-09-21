const express = require('express');
const router = express.Router();
const stockTransferController = require('../controllers/StockTransferController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createStockTransferValidation,
  transferIdValidation,
} = require('../validators/stockTransferValidation');

// All routes require authentication and tenant context
router.use(authMiddleware);

// GET /api/stock-transfers - Get all stock transfers with pagination
router.get(
  '/',
  requirePermission('stocktransfer.view'),
  (req, res, next) => stockTransferController.getTransfers(req, res, next)
);

// GET /api/stock-transfers/:id - Get stock transfer by ID
router.get(
  '/:id',
  requirePermission('stocktransfer.view'),
  transferIdValidation,
  (req, res, next) => stockTransferController.getTransferById(req, res, next)
);

// POST /api/stock-transfers - Create a new stock transfer
router.post(
  '/',
  requirePermission('stocktransfer.create'),
  createStockTransferValidation,
  (req, res, next) => stockTransferController.createTransfer(req, res, next)
);

// PATCH /api/stock-transfers/:id/status - Update transfer status (approve/complete/cancel)
router.patch(
  '/:id/status',
  requirePermission('stocktransfer.approve'),
  transferIdValidation,
  (req, res, next) => stockTransferController.updateTransferStatus(req, res, next)
);

module.exports = router;