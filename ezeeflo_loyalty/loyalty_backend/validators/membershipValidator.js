const { body } = require('express-validator');

const createTierValidator = [
  body('name').notEmpty().trim().withMessage('Tier name is required'),
  body('code').notEmpty().trim().withMessage('Tier code is required')
    .matches(/^[a-z_]+$/).withMessage('Code must be lowercase with underscores'),
  body('minPoints').isInt({ min: 0 }).withMessage('Minimum points must be 0 or greater'),
  body('maxPoints').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('pointMultiplier').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('benefits').optional(),
  body('color').optional(),
  body('sortOrder').optional().isInt(),
];

const updateTierValidator = [
  body('name').optional().notEmpty().trim(),
  body('minPoints').optional().isInt({ min: 0 }),
  body('maxPoints').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('pointMultiplier').optional({ values: 'falsy' }).isFloat({ min: 0 }),
];

const assignTierValidator = [
  body('tierId').notEmpty().withMessage('Tier ID is required'),
  body('notes').optional().trim(),
];

module.exports = { createTierValidator, updateTierValidator, assignTierValidator };
