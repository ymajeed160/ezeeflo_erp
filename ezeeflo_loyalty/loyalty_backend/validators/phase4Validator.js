const { body } = require('express-validator');

// Campaigns
const createCampaignValidator = [
  body('name').notEmpty().trim().withMessage('Campaign name is required'),
  body('code').notEmpty().trim().withMessage('Campaign code is required').matches(/^[A-Z0-9_]+$/).withMessage('Code must be uppercase alphanumeric'),
  body('campaignType').isIn(['points_multiplier','bonus_points','birthday','welcome','referral','festival','weekend','spend_threshold','product','category','store']).withMessage('Invalid campaign type'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
];

const updateCampaignStatusValidator = [body('status').isIn(['draft','active','paused','ended','canceled']).withMessage('Invalid status')];

// Coupons
const generateCouponValidator = [
  body('count').optional().isInt({ min: 1, max: 100 }).withMessage('Count must be 1-100'),
  body('prefix').optional().trim(),
  body('discountType').isIn(['percentage','fixed_amount','points']).withMessage('Invalid discount type'),
  body('discountValue').isFloat({ min: 0.01 }).withMessage('Discount value must be positive'),
  body('startDate').optional(),
  body('endDate').optional(),
];

const validateCouponValidator = [
  body('code').notEmpty().trim().withMessage('Coupon code is required'),
  body('customerId').optional(),
  body('orderAmount').optional().isFloat({ min: 0 }),
];

const redeemCouponValidator = [
  body('code').notEmpty().trim().withMessage('Coupon code is required'),
  body('customerId').notEmpty().withMessage('Customer ID is required'),
  body('orderAmount').optional().isFloat({ min: 0 }),
  body('orderReference').optional().trim(),
];

// Gift Cards
const purchaseGiftCardValidator = [
  body('initialBalance').isFloat({ min: 0.01 }).withMessage('Initial balance must be positive'),
  body('purchaserCustomerId').optional({ checkFalsy: true }),
  body('recipientCustomerId').optional({ checkFalsy: true }),
  body('recipientEmail').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('recipientPhone').optional({ checkFalsy: true }),
  body('message').optional({ checkFalsy: true }),
  body('expiryDate').optional({ checkFalsy: true }),
];

const redeemGiftCardValidator = [
  body('cardNumber').notEmpty().trim().withMessage('Card number is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('customerId').optional(),
  body('orderReference').optional(),
];

const rechargeGiftCardValidator = [
  body('cardNumber').notEmpty().trim().withMessage('Card number is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
];

const cancelGiftCardValidator = [
  body('cardNumber').notEmpty().trim().withMessage('Card number is required'),
];

// Referrals
const generateReferralCodeValidator = [
  body('customerId').notEmpty().withMessage('Customer ID is required'),
];

const createReferralValidator = [
  body('referralCode').notEmpty().trim().withMessage('Referral code is required'),
  body('firstName').notEmpty().trim().withMessage('First name is required'),
  body('phone').notEmpty().trim().withMessage('Phone is required'),
  body('email').optional().isEmail(),
];

module.exports = {
  createCampaignValidator, updateCampaignStatusValidator,
  generateCouponValidator, validateCouponValidator, redeemCouponValidator,
  purchaseGiftCardValidator, redeemGiftCardValidator, rechargeGiftCardValidator, cancelGiftCardValidator,
  generateReferralCodeValidator, createReferralValidator,
};
