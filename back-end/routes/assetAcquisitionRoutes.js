const express = require('express');
const router = express.Router();
const acqController = require('../controllers/AssetAcquisitionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  createAcquisitionValidation,
  acquisitionIdValidation,
} = require('../validators/assetAcquisitionValidation');

router.use(authMiddleware);

// Get next acquisition number
router.get(
  '/next-number',
  requirePermission('fixedasset.create'),
  (req, res, next) => acqController.getNextAcquisitionNumber(req, res, next)
);

// List acquisitions
router.get(
  '/',
  requirePermission('fixedasset.view'),
  (req, res, next) => acqController.getAcquisitions(req, res, next)
);

// Get single acquisition
router.get(
  '/:id',
  requirePermission('fixedasset.view'),
  acquisitionIdValidation,
  (req, res, next) => acqController.getAcquisitionById(req, res, next)
);

// Create acquisition
router.post(
  '/',
  requirePermission('fixedasset.create'),
  createAcquisitionValidation,
  (req, res, next) => acqController.createAcquisition(req, res, next)
);

// Post acquisition (create journal entry)
router.post(
  '/:id/post',
  requirePermission('fixedasset.create'),
  acquisitionIdValidation,
  (req, res, next) => acqController.postAcquisition(req, res, next)
);

// Reverse acquisition
router.post(
  '/:id/reverse',
  requirePermission('fixedasset.edit'),
  acquisitionIdValidation,
  (req, res, next) => acqController.reverseAcquisition(req, res, next)
);

// Delete acquisition
router.delete(
  '/:id',
  requirePermission('fixedasset.delete'),
  acquisitionIdValidation,
  (req, res, next) => acqController.deleteAcquisition(req, res, next)
);

module.exports = router;
