const express = require('express');
const router = express.Router();
const itemController = require('../controllers/ItemController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createItemValidation,
  updateItemValidation,
  itemIdValidation,
} = require('../validators/itemValidation');

// All routes require authentication and tenant context
router.use(authMiddleware);

// GET /api/items - Get all items with pagination and filters
router.get(
  '/',
  requirePermission('item.view'),
  (req, res, next) => itemController.getItems(req, res, next)
);

// GET /api/items/:id - Get item by ID
router.get(
  '/:id',
  requirePermission('item.view'),
  itemIdValidation,
  (req, res, next) => itemController.getItemById(req, res, next)
);

// POST /api/items - Create a new item
router.post(
  '/',
  requirePermission('item.create'),
  createItemValidation,
  (req, res, next) => itemController.createItem(req, res, next)
);

// PUT /api/items/:id - Update an item
router.put(
  '/:id',
  requirePermission('item.edit'),
  itemIdValidation,
  updateItemValidation,
  (req, res, next) => itemController.updateItem(req, res, next)
);

// DELETE /api/items/:id - Delete an item
router.delete(
  '/:id',
  requirePermission('item.delete'),
  itemIdValidation,
  (req, res, next) => itemController.deleteItem(req, res, next)
);

// PATCH /api/items/:id/toggle-status - Toggle active/inactive
router.patch(
  '/:id/toggle-status',
  requirePermission('item.edit'),
  itemIdValidation,
  (req, res, next) => itemController.toggleItemStatus(req, res, next)
);

module.exports = router;