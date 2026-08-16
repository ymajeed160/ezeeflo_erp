const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const locationTypes = ['building', 'floor', 'room', 'clinic', 'department', 'warehouse'];

const assetLocationIdValidation = [
  param('id')
    .notEmpty().withMessage('Asset location ID is required')
    .isUUID(4).withMessage('Invalid asset location ID format'),
  handleValidationErrors,
];

const createAssetLocationValidation = [
  body('locationCode')
    .trim().notEmpty().withMessage('Location code is required')
    .isLength({ min: 1, max: 50 }).withMessage('Location code must be between 1 and 50 characters'),
  body('locationName')
    .trim().notEmpty().withMessage('Location name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Location name must be between 2 and 200 characters'),
  body('locationType')
    .trim().notEmpty().withMessage('Location type is required')
    .isIn(locationTypes).withMessage(`Location type must be one of: ${locationTypes.join(', ')}`),
  body('parentId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid parent location ID format'),
  body('description')
    .optional({ nullable: true }).trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const updateAssetLocationValidation = [
  body('locationCode')
    .optional().trim()
    .isLength({ min: 1, max: 50 }).withMessage('Location code must be between 1 and 50 characters'),
  body('locationName')
    .optional().trim()
    .isLength({ min: 2, max: 200 }).withMessage('Location name must be between 2 and 200 characters'),
  body('locationType')
    .optional().trim()
    .isIn(locationTypes).withMessage(`Location type must be one of: ${locationTypes.join(', ')}`),
  body('parentId')
    .optional({ nullable: true })
    .isUUID(4).withMessage('Invalid parent location ID format'),
  body('description')
    .optional({ nullable: true }).trim()
    .isLength({ max: 2000 }).withMessage('Description must not exceed 2000 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

module.exports = {
  createAssetLocationValidation,
  updateAssetLocationValidation,
  assetLocationIdValidation,
};
