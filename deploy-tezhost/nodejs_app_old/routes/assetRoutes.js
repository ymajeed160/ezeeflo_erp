const express = require('express');
const router = express.Router();
const assetController = require('../controllers/AssetController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createAssetValidation,
  updateAssetValidation,
  assetIdValidation,
  updateAssetStatusValidation,
} = require('../validators/assetValidation');

// All routes require authentication
router.use(authMiddleware);

// Get active assets (compact list for dropdowns)
router.get(
  '/active',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetController.getActiveAssets(req, res, next)
);

// Get next asset code
router.get(
  '/next-code',
  requirePermission('fixedasset.create'),
  (req, res, next) => assetController.getNextAssetCode(req, res, next)
);

// List assets
router.get(
  '/',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetController.getAssets(req, res, next)
);

// Get single asset
router.get(
  '/:id',
  requirePermission('fixedasset.view'),
  assetIdValidation,
  (req, res, next) => assetController.getAssetById(req, res, next)
);

// Create asset
router.post(
  '/',
  requirePermission('fixedasset.create'),
  createAssetValidation,
  (req, res, next) => assetController.createAsset(req, res, next)
);

// Update asset
router.put(
  '/:id',
  requirePermission('fixedasset.edit'),
  assetIdValidation,
  updateAssetValidation,
  (req, res, next) => assetController.updateAsset(req, res, next)
);

// Update asset status
router.patch(
  '/:id/status',
  requirePermission('fixedasset.edit'),
  assetIdValidation,
  updateAssetStatusValidation,
  (req, res, next) => assetController.updateAssetStatus(req, res, next)
);

// Delete asset
router.delete(
  '/:id',
  requirePermission('fixedasset.delete'),
  assetIdValidation,
  (req, res, next) => assetController.deleteAsset(req, res, next)
);

module.exports = router;
