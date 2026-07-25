const express = require('express');
const router = express.Router();
const assetCustodianController = require('../controllers/AssetCustodianController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createAssetCustodianValidation,
  updateAssetCustodianValidation,
  assetCustodianIdValidation,
} = require('../validators/assetCustodianValidation');

// All routes require authentication
router.use(authMiddleware);

// Get active asset custodians (compact list for dropdowns)
router.get(
  '/active',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetCustodianController.getActiveCustodians(req, res, next)
);

// List asset custodians
router.get(
  '/',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetCustodianController.getCustodians(req, res, next)
);

// Get single asset custodian
router.get(
  '/:id',
  requirePermission('fixedasset.view'),
  assetCustodianIdValidation,
  (req, res, next) => assetCustodianController.getCustodianById(req, res, next)
);

// Create asset custodian
router.post(
  '/',
  requirePermission('fixedasset.create'),
  createAssetCustodianValidation,
  (req, res, next) => assetCustodianController.createCustodian(req, res, next)
);

// Update asset custodian
router.put(
  '/:id',
  requirePermission('fixedasset.edit'),
  assetCustodianIdValidation,
  updateAssetCustodianValidation,
  (req, res, next) => assetCustodianController.updateCustodian(req, res, next)
);

// Toggle status
router.patch(
  '/:id/toggle-status',
  requirePermission('fixedasset.edit'),
  assetCustodianIdValidation,
  (req, res, next) => assetCustodianController.toggleCustodianStatus(req, res, next)
);

// Delete asset custodian
router.delete(
  '/:id',
  requirePermission('fixedasset.delete'),
  assetCustodianIdValidation,
  (req, res, next) => assetCustodianController.deleteCustodian(req, res, next)
);

module.exports = router;
