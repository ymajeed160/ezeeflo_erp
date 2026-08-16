const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const conditions = ['new', 'good', 'fair', 'poor', 'damaged', 'obsolete'];

const assetAuditIdValidation = [
  param('id')
    .notEmpty().withMessage('Asset audit ID is required')
    .isUUID(4).withMessage('Invalid asset audit ID format'),
  handleValidationErrors,
];

const createAssetAuditValidation = [
  body('auditNumber')
    .optional({ nullable: true }).trim()
    .isLength({ max: 50 }).withMessage('Audit number must not exceed 50 characters'),
  body('auditDate')
    .optional({ nullable: true })
    .isISO8601().withMessage('Audit date must be a valid ISO 8601 date'),
  body('assetId')
    .notEmpty().withMessage('Asset ID is required')
    .isUUID(4).withMessage('Invalid asset ID format'),
  body('verifiedLocation')
    .optional({ nullable: true }).trim()
    .isLength({ max: 300 }).withMessage('Verified location must not exceed 300 characters'),
  body('verifiedCondition')
    .optional({ nullable: true }).trim()
    .isIn(conditions).withMessage(`Verified condition must be one of: ${conditions.join(', ')}`),
  body('verifiedCustodian')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Verified custodian must not exceed 200 characters'),
  body('barcodeScanned')
    .optional({ nullable: true }).trim()
    .isLength({ max: 200 }).withMessage('Barcode scanned must not exceed 200 characters'),
  body('qrScanned')
    .optional({ nullable: true }).trim(),
  body('isVerified')
    .optional()
    .isBoolean().withMessage('isVerified must be a boolean'),
  body('isMissing')
    .optional()
    .isBoolean().withMessage('isMissing must be a boolean'),
  body('isFound')
    .optional()
    .isBoolean().withMessage('isFound must be a boolean'),
  body('remarks')
    .optional({ nullable: true }).trim()
    .isLength({ max: 5000 }).withMessage('Remarks must not exceed 5000 characters'),
  handleValidationErrors,
];

module.exports = {
  createAssetAuditValidation,
  assetAuditIdValidation,
};
