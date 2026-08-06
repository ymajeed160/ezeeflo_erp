const { body } = require('express-validator');

const createRewardValidator = [
  body('name').notEmpty().trim().withMessage('Reward name is required'),
  body('code').notEmpty().trim().withMessage('Reward code is required')
    .matches(/^[A-Z0-9_]+$/).withMessage('Code must be uppercase alphanumeric'),
  body('rewardType').isIn(['gift_voucher', 'free_product', 'discount', 'cash_voucher', 'service', 'membership_upgrade', 'other'])
    .withMessage('Invalid reward type'),
  body('pointsRequired').isInt({ min: 1 }).withMessage('Points required must be at least 1'),
  body('value').optional({ values: 'falsy' }).isFloat({ min: 0 }),
  body('validityDays').optional({ values: 'falsy' }).isInt({ min: 1 }),
  body('stockQuantity').optional({ values: 'falsy' }).isInt({ min: -1 }),
  body('redemptionLimitPerCustomer').optional({ values: 'falsy' }).isInt({ min: -1 }),
];

const updateRewardValidator = [
  body('name').optional().notEmpty().trim(),
  body('pointsRequired').optional().isInt({ min: 1 }),
  body('value').optional({ values: 'falsy' }).isFloat({ min: 0 }),
];

const redeemRewardValidator = [
  body('rewardId').notEmpty().withMessage('Reward ID is required'),
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('notes').optional().trim(),
];

module.exports = { createRewardValidator, updateRewardValidator, redeemRewardValidator };
