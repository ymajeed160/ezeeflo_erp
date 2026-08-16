const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const custodianTypes = ['employee', 'doctor', 'department'];

const assetCustodianIdValidation = [
  param('id')
    .notEmpty().withMessage('Asset custodian ID is required')
    .isUUID(4).withMessage('Invalid asset custodian ID format'),
  handleValidationErrors,
];

const createAssetCustodianValidation = [
  body('custodianCode')
    .trim().notEmpty().withMessage('Custodian code is required')
    .isLength({ min: 1, max: 50 }).withMessage('Custodian code must be between 1 and 50 characters'),
  body('custodianName')
    .trim().notEmpty().withMessage('Custodian name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Custodian name must be between 2 and 200 characters'),
  body('custodianType')
    .trim().notEmpty().withMessage('Custodian type is required')
    .isIn(custodianTypes).withMessage(`Custodian type must be one of: ${custodianTypes.join(', ')}`),
  body('email')
    .optional({ nullable: true }).trim()
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 200 }).withMessage('Email must not exceed 200 characters'),
  body('phone')
    .optional({ nullable: true }).trim()
    .isLength({ max: 50 }).withMessage('Phone must not exceed 50 characters'),
  body('department')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Department must not exceed 200 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

const updateAssetCustodianValidation = [
  body('custodianCode')
    .optional().trim()
    .isLength({ min: 1, max: 50 }).withMessage('Custodian code must be between 1 and 50 characters'),
  body('custodianName')
    .optional().trim()
    .isLength({ min: 2, max: 200 }).withMessage('Custodian name must be between 2 and 200 characters'),
  body('custodianType')
    .optional().trim()
    .isIn(custodianTypes).withMessage(`Custodian type must be one of: ${custodianTypes.join(', ')}`),
  body('email')
    .optional({ nullable: true }).trim()
    .isEmail().withMessage('Invalid email format')
    .isLength({ max: 200 }).withMessage('Email must not exceed 200 characters'),
  body('phone')
    .optional({ nullable: true }).trim()
    .isLength({ max: 50 }).withMessage('Phone must not exceed 50 characters'),
  body('department')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Department must not exceed 200 characters'),
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors,
];

module.exports = {
  createAssetCustodianValidation,
  updateAssetCustodianValidation,
  assetCustodianIdValidation,
};
