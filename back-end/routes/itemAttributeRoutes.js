'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/ItemAttributeController');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  attributeIdValidation,
  createAttributeValidation,
  updateAttributeValidation,
} = require('../validators/itemVariantValidation');

router.get('/', requirePermission('item.view'), (req, res, next) => controller.getAttributes(req, res, next));
router.get('/:id', requirePermission('item.view'), attributeIdValidation, (req, res, next) => controller.getAttributeById(req, res, next));
router.post('/', requirePermission('item.create'), createAttributeValidation, (req, res, next) => controller.createAttribute(req, res, next));
router.put('/:id', requirePermission('item.edit'), updateAttributeValidation, (req, res, next) => controller.updateAttribute(req, res, next));
router.delete('/:id', requirePermission('item.delete'), attributeIdValidation, (req, res, next) => controller.deleteAttribute(req, res, next));

module.exports = router;
