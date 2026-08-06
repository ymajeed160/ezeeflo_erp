const { body } = require('express-validator');

const createCustomerValidator = [
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('phone').notEmpty().trim().withMessage('Phone is required'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('dateOfBirth').optional().isDate().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('segment').optional().trim(),
  body('tags').optional(),
  body('source').optional().trim(),
];

const updateCustomerValidator = [
  body('firstName').optional().notEmpty().trim().withMessage('First name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().notEmpty().trim().withMessage('Phone cannot be empty'),
  body('dateOfBirth').optional({ values: 'falsy' }).isDate().withMessage('Invalid date format'),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female', 'other']),
];

const mergeCustomersValidator = [
  body('primaryId').notEmpty().withMessage('Primary customer ID is required'),
  body('secondaryId').notEmpty().withMessage('Secondary customer ID is required'),
];

module.exports = { createCustomerValidator, updateCustomerValidator, mergeCustomersValidator };
