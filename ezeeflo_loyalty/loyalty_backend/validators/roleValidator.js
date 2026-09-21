const { body } = require('express-validator');

const createRoleValidator = [
  body('name').notEmpty().withMessage('Role name is required'),
  body('code').notEmpty().trim().withMessage('Role code is required')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Role code must be alphanumeric (letters, numbers, underscores)'),
  body('permissionIds').optional().isArray().withMessage('Permission IDs must be an array'),
];

const updateRoleValidator = [
  body('name').optional().notEmpty().withMessage('Role name cannot be empty'),
  body('permissionIds').optional().isArray().withMessage('Permission IDs must be an array'),
];

module.exports = { createRoleValidator, updateRoleValidator };
