'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/ItemVariantController');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  itemIdValidation,
  variantIdValidation,
  findOrCreateValidation,
} = require('../validators/itemVariantValidation');

// Search (used by sales/procurement item pickers) — list before /:itemId route
router.get('/search', requirePermission('item.view'), (req, res, next) => controller.searchVariants(req, res, next));

router.get('/item/:itemId', requirePermission('item.view'), itemIdValidation, (req, res, next) => controller.listVariants(req, res, next));
router.get('/item/:itemId/attributes', requirePermission('item.view'), itemIdValidation, (req, res, next) => controller.getApplicableAttributes(req, res, next));
router.post('/item/:itemId/resolve', requirePermission('item.create'), findOrCreateValidation, (req, res, next) => controller.findOrCreate(req, res, next));

router.get('/:id', requirePermission('item.view'), variantIdValidation, (req, res, next) => controller.getVariant(req, res, next));
router.patch('/:id/toggle-status', requirePermission('item.edit'), variantIdValidation, (req, res, next) => controller.toggleStatus(req, res, next));
router.delete('/:id', requirePermission('item.delete'), variantIdValidation, (req, res, next) => controller.deleteVariant(req, res, next));

module.exports = router;
