'use strict';
const express = require('express');
const router = express.Router();
const controller = require('../controllers/ItemAttributeTemplateController');
const { requirePermission } = require('../middleware/rbacMiddleware');
const {
  templateIdValidation,
  createTemplateValidation,
  updateTemplateValidation,
} = require('../validators/itemVariantValidation');

router.get('/', requirePermission('item.view'), (req, res, next) => controller.getTemplates(req, res, next));
router.get('/:id', requirePermission('item.view'), templateIdValidation, (req, res, next) => controller.getTemplateById(req, res, next));
router.post('/', requirePermission('item.create'), createTemplateValidation, (req, res, next) => controller.createTemplate(req, res, next));
router.put('/:id', requirePermission('item.edit'), updateTemplateValidation, (req, res, next) => controller.updateTemplate(req, res, next));
router.delete('/:id', requirePermission('item.delete'), templateIdValidation, (req, res, next) => controller.deleteTemplate(req, res, next));

module.exports = router;
