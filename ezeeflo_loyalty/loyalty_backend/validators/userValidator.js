const { body } = require('express-validator');

const createUserValidator = [
  body('username').notEmpty().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('roleIds').optional().isArray().withMessage('Role IDs must be an array'),
];

const updateUserValidator = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('roleIds').optional().isArray().withMessage('Role IDs must be an array'),
];

module.exports = { createUserValidator, updateUserValidator };
