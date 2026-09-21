const { body } = require('express-validator');

const createCompanyValidator = [
  body('name').notEmpty().withMessage('Company name is required'),
  body('code').notEmpty().trim().withMessage('Company code is required')
    .matches(/^[A-Z0-9_]+$/).withMessage('Company code must be uppercase alphanumeric'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('country').optional().notEmpty(),
  body('currency').optional().notEmpty(),
];

const updateCompanyValidator = [
  body('name').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
];

const updateStatusValidator = [
  body('status').isIn(['active', 'inactive', 'suspended', 'trial', 'deleted']).withMessage('Invalid status'),
];

module.exports = { createCompanyValidator, updateCompanyValidator, updateStatusValidator };
