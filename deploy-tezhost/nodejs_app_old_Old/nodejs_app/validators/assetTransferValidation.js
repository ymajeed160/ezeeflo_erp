const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const transferIdValidation = [
  param('id').notEmpty().withMessage('Transfer ID is required').isUUID(4).withMessage('Invalid transfer ID format'),
  handleValidationErrors,
];

const createTransferValidation = [
  body('transferNumber').optional().trim().isLength({ max: 50 }),
  body('transferDate').optional().isISO8601().withMessage('Transfer date must be a valid date'),
  body('assetId').notEmpty().withMessage('Asset ID is required').isUUID(4).withMessage('Invalid asset ID'),
  body('toLocation').optional({ nullable: true }).trim().isLength({ max: 300 }),
  body('toDepartment').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('toCustodian').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('toWarehouse').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('toBranch').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('fromLocation').optional({ nullable: true }).trim().isLength({ max: 300 }),
  body('fromDepartment').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('fromCustodian').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('fromWarehouse').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('fromBranch').optional({ nullable: true }).trim().isLength({ max: 200 }),
  body('reason').optional({ nullable: true }).trim().isLength({ max: 2000 }),
  handleValidationErrors,
];

module.exports = { createTransferValidation, transferIdValidation };
