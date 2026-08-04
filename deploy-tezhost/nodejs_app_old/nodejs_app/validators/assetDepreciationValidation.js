const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const deprIdValidation = [
  param('id').notEmpty().withMessage('Depreciation ID required').isUUID(4).withMessage('Invalid ID format'),
  handleValidationErrors,
];

const frequencies = ['monthly', 'quarterly', 'yearly'];

const postDepreciationValidation = [
  body('assetId').notEmpty().withMessage('Asset ID required').isUUID(4),
  body('depreciationDate').optional().isISO8601(),
  body('frequency').optional().isIn(frequencies).withMessage(`Frequency must be: ${frequencies.join(', ')}`),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }),
  body('unitsProduced').optional({ nullable: true }).isFloat({ min: 0 }),
  handleValidationErrors,
];

const previewDepreciationValidation = [
  body('assetId').notEmpty().withMessage('Asset ID required').isUUID(4),
  body('frequency').optional().isIn(frequencies).withMessage(`Frequency must be: ${frequencies.join(', ')}`),
  handleValidationErrors,
];

module.exports = { postDepreciationValidation, previewDepreciationValidation, deprIdValidation };
