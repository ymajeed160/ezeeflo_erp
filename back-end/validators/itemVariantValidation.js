'use strict';
const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const uuidParam = (name) => param(name)
  .notEmpty().withMessage(`${name} is required`)
  .isUUID(4).withMessage(`Invalid ${name} format`);

const attributeIdValidation = [uuidParam('id'), handleValidationErrors];

const createAttributeValidation = [
  body('name').trim().notEmpty().withMessage('Attribute name is required').isLength({ max: 100 }),
  body('code').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('dataType').optional().isIn(['dropdown', 'text', 'number']).withMessage('dataType must be dropdown, text or number'),
  body('isVariantDefining').optional().isBoolean(),
  body('isRequired').optional().isBoolean(),
  body('displayOrder').optional().isInt(),
  body('isActive').optional().isBoolean(),
  body('options').optional().isArray(),
  handleValidationErrors,
];

const updateAttributeValidation = [
  uuidParam('id'),
  body('name').optional().trim().notEmpty().withMessage('Attribute name cannot be empty'),
  body('dataType').optional().isIn(['dropdown', 'text', 'number']).withMessage('dataType must be dropdown, text or number'),
  body('isVariantDefining').optional().isBoolean(),
  body('isRequired').optional().isBoolean(),
  body('displayOrder').optional().isInt(),
  body('isActive').optional().isBoolean(),
  body('options').optional().isArray(),
  handleValidationErrors,
];

const templateIdValidation = [uuidParam('id'), handleValidationErrors];

const createTemplateValidation = [
  body('name').trim().notEmpty().withMessage('Template name is required').isLength({ max: 100 }),
  body('description').optional({ nullable: true }).trim().isLength({ max: 255 }),
  body('isActive').optional().isBoolean(),
  body('attributes').optional().isArray(),
  handleValidationErrors,
];

const updateTemplateValidation = [
  uuidParam('id'),
  body('name').optional().trim().notEmpty().withMessage('Template name cannot be empty'),
  body('description').optional({ nullable: true }).trim(),
  body('isActive').optional().isBoolean(),
  body('attributes').optional().isArray(),
  handleValidationErrors,
];

const itemIdValidation = [uuidParam('itemId'), handleValidationErrors];

const variantIdValidation = [uuidParam('id'), handleValidationErrors];

const findOrCreateValidation = [
  uuidParam('itemId'),
  body('attributeValues')
    .custom((value) => Array.isArray(value) || (value && typeof value === 'object'))
    .withMessage('attributeValues must be an object or array'),
  body('costPrice').optional({ nullable: true }).isDecimal({ force_decimal: false }),
  body('sellingPrice').optional({ nullable: true }).isDecimal({ force_decimal: false }),
  handleValidationErrors,
];

module.exports = {
  attributeIdValidation,
  createAttributeValidation,
  updateAttributeValidation,
  templateIdValidation,
  createTemplateValidation,
  updateTemplateValidation,
  itemIdValidation,
  variantIdValidation,
  findOrCreateValidation,
};
