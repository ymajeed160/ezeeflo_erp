const { body } = require('express-validator');

const earnPointsValidator = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('source').optional().trim(),
  body('referenceType').optional().trim(),
  body('notes').optional().trim(),
];

const redeemPointsValidator = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('source').optional().trim(),
  body('notes').optional().trim(),
];

const reverseTransactionValidator = [
  body('originalTransactionId').notEmpty().withMessage('Original transaction ID is required'),
  body('notes').optional().trim(),
];

const adjustPointsValidator = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('points').isInt().not().equals('0').withMessage('Adjustment points cannot be zero'),
  body('notes').notEmpty().withMessage('Notes are required for adjustments'),
];

const transferPointsValidator = [
  body('fromCustomerId').notEmpty().withMessage('Source customer ID is required'),
  body('toCustomerId').notEmpty().withMessage('Target customer ID is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  body('notes').optional().trim(),
];

const bonusValidator = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('bonusPoints').optional().isInt({ min: 1 }),
];

module.exports = {
  earnPointsValidator, redeemPointsValidator, reverseTransactionValidator,
  adjustPointsValidator, transferPointsValidator, bonusValidator,
};
