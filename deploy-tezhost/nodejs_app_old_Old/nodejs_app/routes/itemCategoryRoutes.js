const express = require('express');
const router = express.Router();
const itemCategoryController = require('../controllers/ItemCategoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
} = require('../validators/itemCategoryValidation');

// All routes require authentication and tenant context
router.use(authMiddleware);

// GET /api/item-categories - Get all categories (flat or tree)
router.get(
  '/',
  requirePermission('category.view'),
  (req, res, next) => itemCategoryController.getAllCategories(req, res, next)
);

// GET /api/item-categories/tree - Get category tree structure
router.get(
  '/tree',
  requirePermission('category.view'),
  (req, res, next) => itemCategoryController.getCategoryTree(req, res, next)
);

// GET /api/item-categories/roots - Get root categories (no parent)
router.get(
  '/roots',
  requirePermission('category.view'),
  (req, res, next) => itemCategoryController.getRootCategories(req, res, next)
);

// GET /api/item-categories/:id - Get category by ID
router.get(
  '/:id',
  requirePermission('category.view'),
  categoryIdValidation,
  (req, res, next) => itemCategoryController.getCategoryById(req, res, next)
);

// GET /api/item-categories/:parentId/children - Get children of a category
router.get(
  '/:parentId/children',
  requirePermission('category.view'),
  categoryIdValidation,
  (req, res, next) => itemCategoryController.getChildCategories(req, res, next)
);

// POST /api/item-categories - Create a new category
router.post(
  '/',
  requirePermission('category.create'),
  createCategoryValidation,
  (req, res, next) => itemCategoryController.createCategory(req, res, next)
);

// PUT /api/item-categories/:id - Update a category
router.put(
  '/:id',
  requirePermission('category.edit'),
  categoryIdValidation,
  updateCategoryValidation,
  (req, res, next) => itemCategoryController.updateCategory(req, res, next)
);

// DELETE /api/item-categories/:id - Delete a category
router.delete(
  '/:id',
  requirePermission('category.delete'),
  categoryIdValidation,
  (req, res, next) => itemCategoryController.deleteCategory(req, res, next)
);

// PATCH /api/item-categories/:id/toggle-status - Toggle active/inactive
router.patch(
  '/:id/toggle-status',
  requirePermission('category.edit'),
  categoryIdValidation,
  (req, res, next) => itemCategoryController.toggleCategoryStatus(req, res, next)
);

module.exports = router;