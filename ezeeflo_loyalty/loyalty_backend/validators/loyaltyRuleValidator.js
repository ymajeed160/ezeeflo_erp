const { body } = require('express-validator');

const createRuleValidator = [
  body('name').notEmpty().withMessage('Rule name is required'),
  body('code').notEmpty().trim().withMessage('Rule code is required')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Code must be alphanumeric'),
  body('ruleType').isIn(['earn', 'redeem', 'bonus', 'tier_upgrade', 'tier_downgrade', 'expiry'])
    .withMessage('Invalid rule type'),
  body('priority').optional().isInt({ min: 0 }),
  body('conditions').optional(),
  body('actions').optional(),
];

const updateRuleValidator = [
  body('name').optional().notEmpty(),
  body('code').optional().trim().notEmpty(),
  body('ruleType').optional().isIn(['earn', 'redeem', 'bonus', 'tier_upgrade', 'tier_downgrade', 'expiry']),
];

module.exports = { createRuleValidator, updateRuleValidator };
