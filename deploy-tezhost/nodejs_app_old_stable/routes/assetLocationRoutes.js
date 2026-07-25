const express = require('express');
const router = express.Router();
const assetLocationController = require('../controllers/AssetLocationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createAssetLocationValidation,
  updateAssetLocationValidation,
  assetLocationIdValidation,
} = require('../validators/assetLocationValidation');

// All routes require authentication
router.use(authMiddleware);

// Get active asset locations (compact list for dropdowns)
router.get(
  '/active',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetLocationController.getActiveLocations(req, res, next)
);

// List asset locations
router.get(
  '/',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetLocationController.getLocations(req, res, next)
);

// Get single asset location
router.get(
  '/:id',
  requirePermission('fixedasset.view'),
  assetLocationIdValidation,
  (req, res, next) => assetLocationController.getLocationById(req, res, next)
);

// Create asset location
router.post(
  '/',
  requirePermission('fixedasset.create'),
  createAssetLocationValidation,
  (req, res, next) => assetLocationController.createLocation(req, res, next)
);

// Update asset location
router.put(
  '/:id',
  requirePermission('fixedasset.edit'),
  assetLocationIdValidation,
  updateAssetLocationValidation,
  (req, res, next) => assetLocationController.updateLocation(req, res, next)
);

// Toggle status
router.patch(
  '/:id/toggle-status',
  requirePermission('fixedasset.edit'),
  assetLocationIdValidation,
  (req, res, next) => assetLocationController.toggleLocationStatus(req, res, next)
);

// Delete asset location
router.delete(
  '/:id',
  requirePermission('fixedasset.delete'),
  assetLocationIdValidation,
  (req, res, next) => assetLocationController.deleteLocation(req, res, next)
);

module.exports = router;
