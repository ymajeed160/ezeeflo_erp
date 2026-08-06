const { Referral, Customer, LoyaltyAccount } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/appError');
const pointsEngine = require('./PointsEngineService');

class ReferralService {
  _generateReferralCode(customerCode) {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REF-${customerCode || 'XX'}-${random}`;
  }

  async getAll(companyId, { page = 1, limit = 20, status, referrerCustomerId } = {}) {
    const where = { companyId };
    if (status) where.status = status;
    if (referrerCustomerId) where.referrerCustomerId = referrerCustomerId;

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await Referral.findAndCountAll({
      where,
      include: [
        { model: Customer, as: 'referrer', attributes: ['id', 'code', 'firstName', 'lastName', 'phone'], required: false },
        { model: Customer, as: 'referred', attributes: ['id', 'code', 'firstName', 'lastName', 'phone'], required: false },
      ],
      limit: parseInt(limit) || 20, offset, order: [['createdAt', 'DESC']], distinct: true,
    });
    return { rows, count, pagination: { page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count, totalPages: Math.ceil(count / (parseInt(limit) || 20)), hasNext: offset + parseInt(limit) < count, hasPrev: (parseInt(page) || 1) > 1 } };
  }

  async getById(id, companyId) {
    const referral = await Referral.findOne({
      where: { id, companyId },
      include: [
        { model: Customer, as: 'referrer', attributes: ['id', 'code', 'firstName', 'lastName'] },
        { model: Customer, as: 'referred', attributes: ['id', 'code', 'firstName', 'lastName'] },
      ],
    });
    if (!referral) throw new NotFoundError('Referral not found');
    return referral;
  }

  /**
   * Generate a referral code for a customer
   */
  async generateReferralCode(customerId, companyId) {
    const customer = await Customer.findOne({ where: { id: customerId, companyId } });
    if (!customer) throw new NotFoundError('Customer not found');

    // Check if already has active referral code
    const existing = await Referral.findOne({
      where: { referrerCustomerId: customerId, companyId, status: { [Op.in]: ['pending', 'registered', 'rewarded'] } },
    });
    // We don't block — allow multiple referral codes

    const code = this._generateReferralCode(customer.code);

    return await Referral.create({
      id: uuidv4(), companyId, referrerCustomerId: customerId,
      referralCode: code, status: 'pending',
      rewardType: 'points', rewardValue: 100,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
  }

  /**
   * Record a new referral (when someone uses a referral code)
   */
  async createReferral(referralCode, referredData, companyId) {
    const referral = await Referral.findOne({
      where: { referralCode, companyId, status: 'pending' },
    });
    if (!referral) throw new NotFoundError('Invalid or expired referral code');

    // Check expiry
    if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
      referral.status = 'expired';
      await referral.save();
      throw new ValidationError('Referral code has expired');
    }

    // Check if referred already exists by email/phone
    if (referredData.email) {
      const existingEmail = await Customer.findOne({ where: { email: referredData.email, companyId } });
      if (existingEmail) throw new ConflictError('A customer with this email already exists');
    }
    if (referredData.phone) {
      const existingPhone = await Customer.findOne({ where: { phone: referredData.phone, companyId } });
      if (existingPhone) throw new ConflictError('A customer with this phone already exists');
    }

    // Create the referred customer
    const customerService = require('./CustomerService');
    const referredCustomer = await customerService.create({
      ...referredData,
      source: 'referral',
      notes: `Referred by customer ${referral.referrerCustomerId} (code: ${referralCode})`,
    }, companyId, null);

    // Update referral
    referral.referredCustomerId = referredCustomer.id;
    referral.referredEmail = referredData.email;
    referral.referredPhone = referredData.phone;
    referral.status = 'registered';
    referral.registeredDate = new Date();
    await referral.save();

    return { referral, referredCustomer };
  }

  /**
   * Grant rewards to both referrer and referred
   */
  async grantRewards(referralId, companyId) {
    const referral = await Referral.findOne({ where: { id: referralId, companyId, status: 'registered' } });
    if (!referral) throw new NotFoundError('Referral not found or not in registered state');

    const rewardValue = parseFloat(referral.rewardValue) || 100;

    // Reward referrer
    if (!referral.referrerRewarded) {
      await pointsEngine.earnPoints({
        customerId: referral.referrerCustomerId, companyId,
        points: rewardValue,
        source: 'Referral',
        referenceType: 'referral', referenceId: referralId,
        notes: `Referral reward for ${referral.referralCode}`,
      });
      referral.referrerRewarded = true;
    }

    // Reward referred
    if (!referral.referredRewarded && referral.referredCustomerId) {
      await pointsEngine.earnPoints({
        customerId: referral.referredCustomerId, companyId,
        points: Math.round(rewardValue / 2),
        source: 'Referral',
        referenceType: 'referral', referenceId: referralId,
        notes: `Welcome referral bonus`,
      });
      referral.referredRewarded = true;
    }

    referral.status = 'rewarded';
    referral.rewardedDate = new Date();
    await referral.save();

    return referral;
  }

  async getReferralStats(companyId, customerId) {
    const where = { companyId };
    if (customerId) where.referrerCustomerId = customerId;

    const [totalReferrals, pendingReferrals, registeredReferrals, rewardedReferrals, totalRewards] = await Promise.all([
      Referral.count({ where }),
      Referral.count({ where: { ...where, status: 'pending' } }),
      Referral.count({ where: { ...where, status: 'registered' } }),
      Referral.count({ where: { ...where, status: 'rewarded' } }),
      Referral.sum('rewardValue', { where: { ...where, status: 'rewarded' } }),
    ]);

    return {
      totalReferrals, pendingReferrals, registeredReferrals, rewardedReferrals,
      totalRewards: totalRewards || 0,
      conversionRate: totalReferrals > 0 ? Math.round((rewardedReferrals / totalReferrals) * 100) : 0,
    };
  }
}

module.exports = new ReferralService();
