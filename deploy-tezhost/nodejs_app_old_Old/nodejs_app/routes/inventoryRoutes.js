const express = require('express');
const router = express.Router();
const inventoryReportController = require('../controllers/InventoryReportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');

// All routes require authentication and tenant context
router.use(authMiddleware);

// GET /api/inventory/balances - Get inventory balances
router.get(
  '/balances',
  requirePermission('inventory.view'),
  (req, res, next) => inventoryReportController.getInventoryBalances(req, res, next)
);

// GET /api/inventory/balances/:warehouseId/:itemId - Get balance for specific warehouse and item
router.get(
  '/balances/:warehouseId/:itemId',
  requirePermission('inventory.view'),
  (req, res, next) => inventoryReportController.getBalanceByWarehouseAndItem(req, res, next)
);

// GET /api/inventory/transactions - Get inventory transaction history
router.get(
  '/transactions',
  requirePermission('inventory.view'),
  (req, res, next) => inventoryReportController.getTransactionHistory(req, res, next)
);

// GET /api/inventory/items/:itemId/movement-summary - Get item movement summary
router.get(
  '/items/:itemId/movement-summary',
  requirePermission('inventory.view'),
  (req, res, next) => inventoryReportController.getItemMovementSummary(req, res, next)
);

module.exports = router;