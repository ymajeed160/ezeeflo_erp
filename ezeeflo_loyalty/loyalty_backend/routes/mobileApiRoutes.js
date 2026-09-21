const express = require('express');
const router = express.Router();
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');
const ApiResponse = require('../utils/apiResponse');
const walletService = require('../services/WalletService');
const digitalCardService = require('../services/DigitalCardService');
const gamificationService = require('../services/GamificationService');
const { LoyaltyAccount, PointTransaction, Customer, MembershipTier, Reward, RewardRedemption, Referral, Coupon, GiftCard, Campaign } = require('../models');
const { Op } = require('sequelize');

// All mobile routes use authMiddleware (customer must be logged in)
// These are designed for a future React Native / Flutter mobile app

// ==================== Customer Profile ====================
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.user.customerId || req.user.id, companyId: req.user.companyId },
      include: [{ model: LoyaltyAccount, as: 'loyaltyAccount', include: [{ model: MembershipTier, as: 'membership' }] }],
    });
    return ApiResponse.success(res, { data: customer });
  } catch (e) { next(e); }
});

router.put('/me', authMiddleware, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({ where: { companyId: req.user.companyId, id: req.user.customerId } });
    if (!customer) return ApiResponse.badRequest(res, { message: 'Customer not found' });
    const allowed = ['firstName', 'lastName', 'email', 'phone', 'mobile', 'dateOfBirth', 'gender', 'addressLine1', 'addressLine2', 'city', 'state', 'country'];
    const update = {};
    for (const f of allowed) { if (req.body[f] !== undefined) update[f] = req.body[f]; }
    await customer.update(update);
    return ApiResponse.success(res, { data: customer });
  } catch (e) { next(e); }
});

// ==================== Wallet ====================
router.get('/wallet', authMiddleware, async (req, res, next) => {
  try {
    const wallet = await walletService.getWallet(req.query.customerId || req.user.customerId, req.user.companyId);
    return ApiResponse.success(res, { data: wallet });
  } catch (e) { next(e); }
});

// ==================== Points ====================
router.get('/points', authMiddleware, async (req, res, next) => {
  try {
    const account = await LoyaltyAccount.findOne({
      where: { customerId: req.query.customerId || req.user.customerId, companyId: req.user.companyId },
      include: [{ model: MembershipTier, as: 'membership' }],
    });
    return ApiResponse.success(res, { data: account });
  } catch (e) { next(e); }
});

router.get('/transactions', authMiddleware, async (req, res, next) => {
  try {
    const where = { companyId: req.user.companyId, customerId: req.query.customerId || req.user.customerId };
    if (req.query.type) where.transactionType = req.query.type;
    const { count, rows } = await PointTransaction.findAndCountAll({
      where, limit: parseInt(req.query.limit) || 20,
      offset: ((parseInt(req.query.page) || 1) - 1) * (parseInt(req.query.limit) || 20),
      order: [['createdAt', 'DESC']],
    });
    return ApiResponse.paginated(res, { data: rows, pagination: { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(req.query.limit) || 20)) } });
  } catch (e) { next(e); }
});

// ==================== Rewards ====================
router.get('/rewards', authMiddleware, async (req, res, next) => {
  try {
    const rewards = await Reward.findAll({
      where: { companyId: req.user.companyId, isActive: true },
      order: [['pointsRequired', 'ASC']],
      limit: parseInt(req.query.limit) || 50,
    });
    return ApiResponse.success(res, { data: rewards });
  } catch (e) { next(e); }
});

router.post('/rewards/redeem', authMiddleware, async (req, res, next) => {
  try {
    const { rewardId, customerId } = req.body;
    const cid = customerId || req.user.customerId;
    const account = await LoyaltyAccount.findOne({ where: { customerId: cid, companyId: req.user.companyId } });
    if (!account) return ApiResponse.badRequest(res, { message: 'No loyalty account' });
    const reward = await Reward.findByPk(rewardId);
    if (!reward) return ApiResponse.badRequest(res, { message: 'Reward not found' });
    if (account.availablePoints < reward.pointsRequired) return ApiResponse.badRequest(res, { message: 'Insufficient points' });

    account.availablePoints -= reward.pointsRequired;
    account.redeemedPoints += reward.pointsRequired;
    account.lifetimeRedeemed += reward.pointsRequired;
    await account.save();

    await PointTransaction.create({
      companyId: req.user.companyId, loyaltyAccountId: account.id, customerId: cid,
      transactionType: 'redeem', points: -reward.pointsRequired,
      balanceBefore: account.availablePoints + reward.pointsRequired, balanceAfter: account.availablePoints,
      referenceType: 'reward', referenceId: reward.id, source: 'mobile_app', notes: `Redeemed: ${reward.name}`,
    });

    return ApiResponse.success(res, { data: { reward: reward.name, pointsUsed: reward.pointsRequired, remainingBalance: account.availablePoints }, message: 'Reward redeemed!' });
  } catch (e) { next(e); }
});

// ==================== Membership Card ====================
router.get('/membership-card', authMiddleware, async (req, res, next) => {
  try {
    const card = await digitalCardService.generateCard(req.query.customerId || req.user.customerId, req.user.companyId);
    return ApiResponse.success(res, { data: card });
  } catch (e) { next(e); }
});

// ==================== Gamification ====================
router.get('/badges', authMiddleware, async (req, res, next) => {
  try {
    const badges = await gamificationService.getCustomerBadges(req.query.customerId || req.user.customerId, req.user.companyId);
    return ApiResponse.success(res, { data: badges });
  } catch (e) { next(e); }
});

router.get('/streaks', authMiddleware, async (req, res, next) => {
  try {
    const streaks = await gamificationService.getCustomerStreaks(req.query.customerId || req.user.customerId, req.user.companyId);
    return ApiResponse.success(res, { data: streaks });
  } catch (e) { next(e); }
});

// ==================== Referral ====================
router.get('/referral-code', authMiddleware, async (req, res, next) => {
  try {
    const cid = req.query.customerId || req.user.customerId;
    const referral = await Referral.findOne({ where: { referrerCustomerId: cid, companyId: req.user.companyId } });
    const code = referral?.referralCode || `REF-${(cid || 'USER').slice(0, 8)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return ApiResponse.success(res, { data: { referralCode: code, shareLink: `https://app.ezeeflo.com/join?ref=${code}` } });
  } catch (e) { next(e); }
});

// ==================== Campaigns ====================
router.get('/campaigns', authMiddleware, async (req, res, next) => {
  try {
    const now = new Date();
    const campaigns = await Campaign.findAll({
      where: { companyId: req.user.companyId, status: 'active', isActive: true, startDate: { [Op.lte]: now }, endDate: { [Op.gte]: now } },
      limit: 20, order: [['priority', 'DESC']],
    });
    return ApiResponse.success(res, { data: campaigns });
  } catch (e) { next(e); }
});

module.exports = router;
