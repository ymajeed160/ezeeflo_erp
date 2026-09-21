const { body, param } = require('express-validator');
const { handleValidationErrors } = require('./index');

const revaluationIdValidation = [param('id').notEmpty().isUUID(4), handleValidationErrors];

const createRevaluationValidation = [
  body('revaluationNumber').optional().trim().isLength({ max: 50 }),
  body('assetId').notEmpty().isUUID(4),
  body('revaluationDate').optional().isISO8601(),
  body('revaluationType').notEmpty().isIn(['increase', 'decrease']),
  body('revaluationAmount').notEmpty().isFloat({ min: 0.01 }),
  body('reason').optional({ nullable: true }).trim().isLength({ max: 2000 }),
  handleValidationErrors,
];

module.exports = { createRevaluationValidation, revaluationIdValidation };
