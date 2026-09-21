'use strict';

const express = require('express');
const router = express.Router();
const configController = require('../controllers/SystemConfigController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authorize');

router.use(authMiddleware);

// GET /api/settings — all configs grouped with reference data
router.get('/', authorize('settings.read'), configController.getAllConfigs.bind(configController));

// GET /api/settings/references — reference data only
router.get('/references', authorize('settings.read'), configController.getReferenceData.bind(configController));

// PUT /api/settings — save all configs
router.put('/', authorize('settings.update'), configController.saveConfigs.bind(configController));

// Email settings
router.get('/email', authorize('email-settings.read'), configController.getReferenceData.bind(configController));
router.put('/email', authorize('email-settings.update'), configController.saveEmailSettings.bind(configController));
router.post('/email/test', authorize('email-settings.update'), configController.testEmail.bind(configController));

// Number series
router.get('/number-series', authorize('number-series.read'), configController.getNumberSeries.bind(configController));
router.put('/number-series', authorize('number-series.update'), configController.saveNumberSeries.bind(configController));

// Reset
router.delete('/reset', authorize('settings.update'), configController.resetToDefaults.bind(configController));

// VAT Category Codes
router.get('/vat-codes', authorize('settings.read'), configController.getVatCategoryCodes.bind(configController));
router.post('/vat-codes', authorize('settings.update'), configController.saveVatCategoryCode.bind(configController));
router.put('/vat-codes', authorize('settings.update'), configController.saveVatCategoryCode.bind(configController));
router.delete('/vat-codes/:id', authorize('settings.update'), configController.deleteVatCategoryCode.bind(configController));

module.exports = router;
