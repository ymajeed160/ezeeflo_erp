const express = require('express');
const router = express.Router();
const assetAuditController = require('../controllers/AssetAuditController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createAssetAuditValidation,
  assetAuditIdValidation,
} = require('../validators/assetAuditValidation');

// All routes require authentication
router.use(authMiddleware);

// Get next audit number
router.get(
  '/next-number',
  requirePermission('fixedasset.audit'),
  (req, res, next) => assetAuditController.getNextAuditNumber(req, res, next)
);

// List asset audits
router.get(
  '/',
  requirePermission('fixedasset.view'),
  (req, res, next) => assetAuditController.getAudits(req, res, next)
);

// Get single asset audit
router.get(
  '/:id',
  requirePermission('fixedasset.view'),
  assetAuditIdValidation,
  (req, res, next) => assetAuditController.getAuditById(req, res, next)
);

// Create asset audit
router.post(
  '/',
  requirePermission('fixedasset.audit'),
  createAssetAuditValidation,
  (req, res, next) => assetAuditController.createAudit(req, res, next)
);

// Delete asset audit
router.delete(
  '/:id',
  requirePermission('fixedasset.delete'),
  assetAuditIdValidation,
  (req, res, next) => assetAuditController.deleteAudit(req, res, next)
);

module.exports = router;
