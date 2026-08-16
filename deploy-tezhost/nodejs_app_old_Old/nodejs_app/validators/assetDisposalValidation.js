const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const disposalIdValidation = [param('id').notEmpty().isUUID(4), handleValidationErrors];

const disposalTypes = ['sale', 'scrap', 'donation', 'write_off', 'lost'];

const createDisposalValidation = [
  body('disposalNumber').optional().trim().isLength({ max: 50 }),
  body('assetId').notEmpty().isUUID(4),
  body('disposalDate').optional().isISO8601(),
  body('disposalType').notEmpty().isIn(disposalTypes),
  body('saleAmount').optional({ nullable: true }).isFloat({ min: 0 }),
  body('reference').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
  handleValidationErrors,
];

module.exports = { createDisposalValidation, disposalIdValidation };
