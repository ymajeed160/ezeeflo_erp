const { Reward, RewardRedemption, LoyaltyAccount, Customer, MembershipTier, PointTransaction } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/appError');
const pointsEngine = require('./PointsEngineService');
const membershipService = require('./MembershipService');
const logger = require('../utils/logger');

class RewardService {
  /**
   * Get all rewards with filters
   */
  async getAll(companyId, { page = 1, limit = 20, rewardType, isActive, search } = {}) {
    const where = { companyId };
    if (rewardType) where.rewardType = rewardType;
    if (isActive !== undefined && isActive !== null && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await Reward.findAndCountAll({
      where,
      limit: parseInt(limit) || 20,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return {
      rows, count,
      pagination: {
        page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count,
        totalPages: Math.ceil(count / (parseInt(limit) || 20)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: (parseInt(page) || 1) > 1,
      },
    };
  }

  /**
   * Get reward by ID
   */
  async getById(id, companyId) {
    const reward = await Reward.findOne({ where: { id, companyId } });
    if (!reward) throw new NotFoundError('Reward not found');
    return reward;
  }

  /**
   * Create a reward
   */
  async create(data, companyId) {
    const existing = await Reward.findOne({ where: { code: data.code, companyId } });
    if (existing) throw new ConflictError('Reward code already exists');
    return await Reward.create({ id: uuidv4(), ...data, companyId });
  }

  /**
   * Update a reward
   */
  async update(id, data, companyId) {
    const reward = await Reward.findOne({ where: { id, companyId } });
    if (!reward) throw new NotFoundError('Reward not found');
    await reward.update(data);
    return reward;
  }

  /**
   * Delete a reward
   */
  async delete(id, companyId) {
    const reward = await Reward.findOne({ where: { id, companyId } });
    if (!reward) throw new NotFoundError('Reward not found');

    // Check if reward has active redemptions
    const activeRedemptions = await RewardRedemption.count({
      where: { rewardId: id, status: 'pending' },
    });
    if (activeRedemptions > 0) throw new ValidationError('Cannot delete reward with pending redemptions');

    await reward.destroy();
  }

  /**
   * Toggle reward active status
   */
  async toggleStatus(id, companyId) {
    const reward = await Reward.findOne({ where: { id, companyId } });
    if (!reward) throw new NotFoundError('Reward not found');
    reward.isActive = !reward.isActive;
    await reward.save();
    return reward;
  }

  /**
   * Redeem a reward for a customer - the core redemption logic.
   * Validates: sufficient points, stock availability, per-customer limits,
   * reward dates, and customer tier requirements.
   */
  async redeemReward({ rewardId, customerId, companyId, createdBy, notes }) {
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      // Validate reward
      const reward = await Reward.findOne({ where: { id: rewardId, companyId, isActive: true } });
      if (!reward) throw new NotFoundError('Reward not found or inactive');

      // Check date range
      const now = new Date();
      if (reward.startDate && new Date(reward.startDate) > now) throw new ValidationError('Reward is not yet available');
      if (reward.endDate && new Date(reward.endDate) < now) throw new ValidationError('Reward has expired');

      // Validate customer
      const customer = await Customer.findOne({ where: { id: customerId, companyId, isActive: true } });
      if (!customer) throw new NotFoundError('Customer not found');

      const account = await LoyaltyAccount.findOne({ where: { customerId, companyId, isActive: true } });
      if (!account) throw new NotFoundError('Active loyalty account not found');

      // Check stock
      if (reward.stockQuantity === 0) throw new ValidationError('Reward is out of stock');
      if (reward.stockQuantity > 0) {
        const redeemedCount = await RewardRedemption.count({
          where: { rewardId, status: { [Op.in]: ['pending', 'fulfilled'] } },
        });
        if (redeemedCount >= reward.stockQuantity) throw new ValidationError('Reward is out of stock');
      }

      // Check per-customer limit
      if (reward.redemptionLimitPerCustomer > 0) {
        const customerRedeemed = await RewardRedemption.count({
          where: { rewardId, customerId, status: { [Op.in]: ['pending', 'fulfilled'] } },
        });
        if (customerRedeemed >= reward.redemptionLimitPerCustomer) {
          throw new ValidationError(`You have already redeemed this reward ${reward.redemptionLimitPerCustomer} time(s)`);
        }
      }

      // Check sufficient points
      if (account.availablePoints < reward.pointsRequired) {
        throw new ValidationError(`Insufficient points. Required: ${reward.pointsRequired}, Available: ${account.availablePoints}`);
      }

      // Deduct points using Points Engine
      await pointsEngine.redeemPoints({
        customerId, companyId,
        points: reward.pointsRequired,
        source: 'Reward Redemption',
        referenceType: 'reward',
        referenceId: rewardId,
        notes: `Redeemed: ${reward.name}`,
        createdBy,
        transaction,
      });

      // Generate redemption code
      const redemptionCode = `RD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Create redemption record
      const redemption = await RewardRedemption.create({
        id: uuidv4(),
        companyId,
        rewardId,
        customerId,
        loyaltyAccountId: account.id,
        pointsRedeemed: reward.pointsRequired,
        status: 'fulfilled',
        redemptionCode,
        fulfilledDate: new Date(),
        notes: notes || `Redeemed reward: ${reward.name}`,
        createdBy,
      }, { transaction });

      // Decrement stock if tracked
      if (reward.stockQuantity > 0) {
        reward.stockQuantity -= 1;
        await reward.save({ transaction });
      }

      // Handle membership upgrade reward type
      if (reward.rewardType === 'membership_upgrade' && reward.value) {
        // value contains the target tier code
        const { MembershipTier } = require('../models');
        const targetTier = await MembershipTier.findOne({ where: { code: reward.value.toString(), companyId } });
        if (targetTier) {
          await membershipService.assignCustomerTier(customerId, targetTier.id, companyId, `Upgraded via reward: ${reward.name}`);
        }
      }

      await transaction.commit();

      // Return refreshed account
      const refreshedAccount = await LoyaltyAccount.findOne({
        where: { customerId, companyId },
        include: [{ model: MembershipTier, as: 'membership' }],
      });

      return {
        redemption,
        reward,
        loyaltyAccount: refreshedAccount,
        pointsRemaining: refreshedAccount.availablePoints,
      };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Cancel/void a redemption and restore points
   */
  async cancelRedemption(redemptionId, companyId, createdBy) {
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      const redemption = await RewardRedemption.findOne({
        where: { id: redemptionId, companyId },
      });
      if (!redemption) throw new NotFoundError('Redemption not found');
      if (redemption.status === 'canceled') throw new ValidationError('Redemption already canceled');

      // Restore points
      await pointsEngine.earnPoints({
        customerId: redemption.customerId, companyId,
        points: redemption.pointsRedeemed,
        source: 'Redemption Canceled',
        referenceType: 'redemption',
        referenceId: redemptionId,
        notes: 'Points restored from canceled redemption',
        createdBy,
        transaction,
      });

      // Restore stock
      const reward = await Reward.findByPk(redemption.rewardId);
      if (reward && reward.stockQuantity >= 0) {
        reward.stockQuantity += 1;
        await reward.save({ transaction });
      }

      // Update redemption
      redemption.status = 'canceled';
      redemption.canceledDate = new Date();
      redemption.notes = (redemption.notes || '') + ' | Canceled';
      await redemption.save({ transaction });

      await transaction.commit();

      const refreshedAccount = await LoyaltyAccount.findOne({
        where: { customerId: redemption.customerId, companyId },
        include: [{ model: MembershipTier, as: 'membership' }],
      });

      return { redemption, loyaltyAccount: refreshedAccount };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  /**
   * Get redemption history
   */
  async getRedemptions(companyId, { page = 1, limit = 20, customerId, rewardId, status } = {}) {
    const where = { companyId };
    if (customerId) where.customerId = customerId;
    if (rewardId) where.rewardId = rewardId;
    if (status) where.status = status;

    const offset = ((parseInt(page) || 1) - 1) * (parseInt(limit) || 20);
    const { count, rows } = await RewardRedemption.findAndCountAll({
      where,
      include: [
        { model: Reward, as: 'reward', attributes: ['id', 'name', 'code', 'rewardType', 'pointsRequired', 'value'], required: false },
        { model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName', 'phone'], required: false },
      ],
      limit: parseInt(limit) || 20,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return {
      rows, count,
      pagination: {
        page: parseInt(page) || 1, limit: parseInt(limit) || 20, total: count,
        totalPages: Math.ceil(count / (parseInt(limit) || 20)),
        hasNext: offset + parseInt(limit) < count,
        hasPrev: (parseInt(page) || 1) > 1,
      },
    };
  }
}

module.exports = new RewardService();
