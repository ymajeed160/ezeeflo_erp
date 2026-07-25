const express = require('express');
const router = express.Router();
const assetCategoryController = require('../controllers/AssetCategoryController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createAssetCategoryValidation,
  updateAssetCategoryValidation,
  assetCategoryIdValidation,
} = require('../validators/assetCategoryValidation');

// All routes require authentication
router.use(authMiddleware);

// Get active asset categories (compact list for dropdowns)
router.get(
  '/active',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetCategoryController.getActiveAssetCategories(req, res, next)
);

// List asset categories
router.get(
  '/',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetCategoryController.getAssetCategories(req, res, next)
);

// Get single asset category
router.get(
  '/:id',
  requirePermission('fixedasset.view'),
  assetCategoryIdValidation,
  (req, res, next) => assetCategoryController.getAssetCategoryById(req, res, next)
);

// Create asset category
router.post(
  '/',
  requirePermission('fixedasset.create'),
  createAssetCategoryValidation,
  (req, res, next) => assetCategoryController.createAssetCategory(req, res, next)
);

// Update asset category
router.put(
  '/:id',
  requirePermission('fixedasset.edit'),
  assetCategoryIdValidation,
  updateAssetCategoryValidation,
  (req, res, next) => assetCategoryController.updateAssetCategory(req, res, next)
);

// Toggle status
router.patch(
  '/:id/toggle-status',
  requirePermission('fixedasset.edit'),
  assetCategoryIdValidation,
  (req, res, next) => assetCategoryController.toggleAssetCategoryStatus(req, res, next)
);

// Delete asset category
router.delete(
  '/:id',
  requirePermission('fixedasset.delete'),
  assetCategoryIdValidation,
  (req, res, next) => assetCategoryController.deleteAssetCategory(req, res, next)
);

module.exports = router;
