const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/WarehouseController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createWarehouseValidation,
  updateWarehouseValidation,
  warehouseIdValidation,
} = require('../validators/warehouseValidation');

// All routes require authentication and tenant context
router.use(authMiddleware);

// GET /api/warehouses/active - Get active warehouses (for dropdowns)
router.get(
  '/active',
  requirePermission('warehouse.view'),
  (req, res, next) => warehouseController.getActiveWarehouses(req, res, next)
);

// GET /api/warehouses - Get all warehouses with pagination and filters
router.get(
  '/',
  requirePermission('warehouse.view'),
  (req, res, next) => warehouseController.getWarehouses(req, res, next)
);

// GET /api/warehouses/:id - Get warehouse by ID
router.get(
  '/:id',
  requirePermission('warehouse.view'),
  warehouseIdValidation,
  (req, res, next) => warehouseController.getWarehouseById(req, res, next)
);

// POST /api/warehouses - Create a new warehouse
router.post(
  '/',
  requirePermission('warehouse.create'),
  createWarehouseValidation,
  (req, res, next) => warehouseController.createWarehouse(req, res, next)
);

// PUT /api/warehouses/:id - Update a warehouse
router.put(
  '/:id',
  requirePermission('warehouse.edit'),
  warehouseIdValidation,
  updateWarehouseValidation,
  (req, res, next) => warehouseController.updateWarehouse(req, res, next)
);

// DELETE /api/warehouses/:id - Delete a warehouse
router.delete(
  '/:id',
  requirePermission('warehouse.delete'),
  warehouseIdValidation,
  (req, res, next) => warehouseController.deleteWarehouse(req, res, next)
);

// PATCH /api/warehouses/:id/toggle-status - Toggle active/inactive
router.patch(
  '/:id/toggle-status',
  requirePermission('warehouse.edit'),
  warehouseIdValidation,
  (req, res, next) => warehouseController.toggleWarehouseStatus(req, res, next)
);

module.exports = router;