const { LoyaltyAccount, PointTransaction, MembershipTier, Campaign, Customer } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op, Sequelize } = require('sequelize');
const { NotFoundError, ValidationError } = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * Points Engine - Core business logic for earning, redeeming, reversing,
 * adjusting, and expiring loyalty points with configurable rules.
 */
class PointsEngineService {
  /**
   * Earn points for a customer. Applies membership multiplier and active campaigns.
   */
  async earnPoints({ customerId, companyId, points: basePoints, source, referenceType, referenceId, storeId, branchId, posTransactionId, campaignId, couponId, notes, createdBy, transaction }) {
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId, isActive: true },
      include: [{ model: MembershipTier, as: 'membership' }],
    });
    if (!account) throw new NotFoundError('Active loyalty account not found');

    const multiplier = parseFloat(account.membership?.pointMultiplier || 1.0);
    let earnedPoints = Math.round(basePoints * multiplier);

    // Apply campaign bonuses (future: check active campaigns)
    if (campaignId) {
      const campaign = await Campaign.findOne({ where: { id: campaignId, companyId, isActive: true } });
      if (campaign) {
        // Apply campaign rules
        if (campaign.campaignType === 'points_multiplier') {
          const campaignMultiplier = campaign.rules?.multiplier || 1;
          earnedPoints = Math.round(earnedPoints * campaignMultiplier);
        } else if (campaign.campaignType === 'bonus_points') {
          earnedPoints += (campaign.rules?.bonusPoints || 0);
        }
      }
    }

    if (earnedPoints <= 0) throw new ValidationError('Earned points must be greater than 0');

    const balanceBefore = account.availablePoints;
    const balanceAfter = balanceBefore + earnedPoints;

    // Create transaction
    const txn = await PointTransaction.create({
      id: uuidv4(), companyId, loyaltyAccountId: account.id, customerId,
      transactionType: source === 'welcome' ? 'welcome' : source === 'referral' ? 'referral' : source === 'bonus' ? 'bonus' : 'earn',
      points: earnedPoints, balanceBefore, balanceAfter,
      referenceType, referenceId, source, storeId, branchId, posTransactionId,
      campaignId, couponId, notes, createdBy,
    }, { transaction });

    // Update account balances
    account.availablePoints = balanceAfter;
    account.pendingPoints = Math.max(0, (account.pendingPoints || 0));
    account.lifetimeEarned = (account.lifetimeEarned || 0) + earnedPoints;
    account.currentTierPoints = (account.currentTierPoints || 0) + earnedPoints;
    account.lastActivityDate = new Date();
    await account.save({ transaction });

    return { transaction: txn, account };
  }

  /**
   * Redeem points for a reward or discount.
   */
  async redeemPoints({ customerId, companyId, points, source, referenceType, referenceId, notes, createdBy, transaction }) {
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId, isActive: true },
    });
    if (!account) throw new NotFoundError('Active loyalty account not found');

    if (account.availablePoints < points) {
      throw new ValidationError(`Insufficient points. Available: ${account.availablePoints}, Required: ${points}`);
    }

    const balanceBefore = account.availablePoints;
    const balanceAfter = balanceBefore - points;

    const txn = await PointTransaction.create({
      id: uuidv4(), companyId, loyaltyAccountId: account.id, customerId,
      transactionType: 'redeem',
      points: -points, balanceBefore, balanceAfter,
      referenceType, referenceId, source, notes, createdBy,
    }, { transaction });

    account.availablePoints = balanceAfter;
    account.redeemedPoints = (account.redeemedPoints || 0) + points;
    account.lifetimeRedeemed = (account.lifetimeRedeemed || 0) + points;
    account.lastActivityDate = new Date();
    await account.save({ transaction });

    return { transaction: txn, account };
  }

  /**
   * Reverse a previous transaction and restore points.
   */
  async reverseTransaction({ originalTransactionId, companyId, notes, createdBy, transaction }) {
    const original = await PointTransaction.findOne({
      where: { id: originalTransactionId, companyId },
    });
    if (!original) throw new NotFoundError('Original transaction not found');
    if (original.transactionType === 'reverse') throw new ValidationError('Cannot reverse a reversal');

    const account = await LoyaltyAccount.findOne({
      where: { id: original.loyaltyAccountId, companyId, isActive: true },
    });
    if (!account) throw new NotFoundError('Loyalty account not found');

    const reversalPoints = -original.points;
    const balanceBefore = account.availablePoints;
    const balanceAfter = balanceBefore + reversalPoints;

    const reversalTxn = await PointTransaction.create({
      id: uuidv4(), companyId, loyaltyAccountId: account.id, customerId: original.customerId,
      transactionType: 'reverse',
      points: reversalPoints, balanceBefore, balanceAfter,
      referenceType: 'transaction', referenceId: original.id, source: 'Reversal',
      notes: notes || `Reversal of transaction ${original.id}`,
      createdBy,
    }, { transaction });

    account.availablePoints = balanceAfter;
    if (original.transactionType === 'earn' || original.transactionType === 'bonus' || original.transactionType === 'welcome') {
      account.lifetimeEarned = Math.max(0, (account.lifetimeEarned || 0) - original.points);
      account.currentTierPoints = Math.max(0, (account.currentTierPoints || 0) - original.points);
    } else if (original.transactionType === 'redeem') {
      account.redeemedPoints = Math.max(0, (account.redeemedPoints || 0) + original.points);
      account.lifetimeRedeemed = Math.max(0, (account.lifetimeRedeemed || 0) + original.points);
    }
    account.lastActivityDate = new Date();
    await account.save({ transaction });

    return { transaction: reversalTxn, account };
  }

  /**
   * Manual point adjustment (add or deduct).
   */
  async adjustPoints({ customerId, companyId, points, notes, createdBy, transaction }) {
    if (points === 0) throw new ValidationError('Adjustment points cannot be zero');

    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId, isActive: true },
    });
    if (!account) throw new NotFoundError('Active loyalty account not found');

    const balanceBefore = account.availablePoints;
    const balanceAfter = balanceBefore + points;

    if (balanceAfter < 0) throw new ValidationError(`Adjustment would result in negative balance: ${balanceAfter}`);

    const txn = await PointTransaction.create({
      id: uuidv4(), companyId, loyaltyAccountId: account.id, customerId,
      transactionType: 'adjust',
      points, balanceBefore, balanceAfter,
      referenceType: 'manual', source: 'Manual Adjustment',
      notes, createdBy,
    }, { transaction });

    account.availablePoints = balanceAfter;
    if (points > 0) {
      account.lifetimeEarned = (account.lifetimeEarned || 0) + points;
      account.currentTierPoints = (account.currentTierPoints || 0) + points;
    }
    account.lastActivityDate = new Date();
    await account.save({ transaction });

    return { transaction: txn, account };
  }

  /**
   * Expire points for all customers whose points are past expiry.
   * Typically run as a scheduled job.
   */
  async expirePoints(companyId) {
    const now = new Date();
    const expiredTransactions = await PointTransaction.findAll({
      where: {
        companyId,
        transactionType: { [Op.in]: ['earn', 'bonus', 'welcome', 'referral', 'transfer_in'] },
        expiresAt: { [Op.lte]: now, [Op.ne]: null },
      },
    });

    let expiredCount = 0;
    const accountsToUpdate = new Map();

    for (const txn of expiredTransactions) {
      const accountId = txn.loyaltyAccountId;
      if (!accountsToUpdate.has(accountId)) {
        accountsToUpdate.set(accountId, { account: null, expiringPoints: 0 });
      }
      accountsToUpdate.get(accountId).expiringPoints += txn.points;
    }

    for (const [accountId, data] of accountsToUpdate) {
      const account = await LoyaltyAccount.findByPk(accountId);
      if (!account || account.availablePoints <= 0) continue;

      const expPoints = Math.min(data.expiringPoints, account.availablePoints);
      if (expPoints <= 0) continue;

      const balanceBefore = account.availablePoints;
      const balanceAfter = balanceBefore - expPoints;

      await PointTransaction.create({
        id: uuidv4(), companyId, loyaltyAccountId: account.id, customerId: account.customerId,
        transactionType: 'expire',
        points: -expPoints, balanceBefore, balanceAfter,
        referenceType: 'expiry', source: 'Points Expiry',
        notes: `Auto-expired ${expPoints} points`,
      });

      account.availablePoints = balanceAfter;
      account.expiredPoints = (account.expiredPoints || 0) + expPoints;
      account.lastActivityDate = new Date();
      await account.save();

      expiredCount++;
    }

    return { expiredCount, expiredPoints: Array.from(accountsToUpdate.values()).reduce((s, d) => s + d.expiringPoints, 0) };
  }

  /**
   * Welcome bonus for new customer registration.
   */
  async grantWelcomeBonus(customerId, companyId, bonusPoints = 100) {
    return await this.earnPoints({
      customerId, companyId, points: bonusPoints,
      source: 'welcome',
      referenceType: 'registration',
      notes: 'Welcome bonus points',
    });
  }

  /**
   * Birthday bonus for customers on their birthday.
   */
  async grantBirthdayBonus(customerId, companyId, bonusPoints = 50) {
    return await this.earnPoints({
      customerId, companyId, points: bonusPoints,
      source: 'bonus',
      referenceType: 'birthday',
      notes: 'Happy Birthday bonus points!',
    });
  }

  /**
   * Calculate earnable points for a purchase amount with applied rules.
   */
  async calculateEarnablePoints(companyId, customerId, purchaseAmount, { campaignId, storeId, productCategory } = {}) {
    const account = await LoyaltyAccount.findOne({
      where: { customerId, companyId, isActive: true },
      include: [{ model: MembershipTier, as: 'membership' }],
    });

    const multiplier = parseFloat(account?.membership?.pointMultiplier || 1.0);
    let points = Math.round(purchaseAmount * multiplier);

    // Check active campaigns
    if (campaignId) {
      const campaign = await Campaign.findOne({ where: { id: campaignId, companyId, isActive: true } });
      if (campaign && campaign.status === 'active') {
        if (campaign.campaignType === 'points_multiplier') {
          points = Math.round(points * (campaign.rules?.multiplier || 1));
        } else if (campaign.campaignType === 'bonus_points') {
          points += (campaign.rules?.bonusPoints || 0);
        }
      }
    }

    return {
      basePoints: Math.round(purchaseAmount),
      membershipMultiplier: multiplier,
      campaignBonus: points - Math.round(purchaseAmount * multiplier),
      totalPoints: points,
      tier: account?.membership?.name || 'Standard',
    };
  }

  /**
   * Transfer points between two customer accounts.
   */
  async transferPoints({ fromCustomerId, toCustomerId, companyId, points, notes, createdBy, transaction: externalTxn }) {
    if (fromCustomerId === toCustomerId) throw new ValidationError('Cannot transfer to the same account');

    const sequelize = require('../config/database');
    const txn = externalTxn || await sequelize.transaction();

    try {
      const [fromAccount, toAccount] = await Promise.all([
        LoyaltyAccount.findOne({ where: { customerId: fromCustomerId, companyId, isActive: true } }),
        LoyaltyAccount.findOne({ where: { customerId: toCustomerId, companyId, isActive: true } }),
      ]);
      if (!fromAccount) throw new NotFoundError('Source loyalty account not found');
      if (!toAccount) throw new NotFoundError('Target loyalty account not found');
      if (fromAccount.availablePoints < points) throw new ValidationError(`Insufficient points. Available: ${fromAccount.availablePoints}`);

      // Transfer out
      const fromBalanceBefore = fromAccount.availablePoints;
      const fromBalanceAfter = fromBalanceBefore - points;
      const transferOutTxn = await PointTransaction.create({
        id: uuidv4(), companyId, loyaltyAccountId: fromAccount.id, customerId: fromCustomerId,
        transactionType: 'transfer_out', points: -points,
        balanceBefore: fromBalanceBefore, balanceAfter: fromBalanceAfter,
        referenceType: 'transfer', referenceId: toAccount.id,
        source: 'Points Transfer', notes: notes || `Transferred to customer ${toCustomerId}`,
        createdBy,
      }, { transaction: txn });

      fromAccount.availablePoints = fromBalanceAfter;
      await fromAccount.save({ transaction: txn });

      // Transfer in
      const toBalanceBefore = toAccount.availablePoints;
      const toBalanceAfter = toBalanceBefore + points;
      const transferInTxn = await PointTransaction.create({
        id: uuidv4(), companyId, loyaltyAccountId: toAccount.id, customerId: toCustomerId,
        transactionType: 'transfer_in', points,
        balanceBefore: toBalanceBefore, balanceAfter: toBalanceAfter,
        referenceType: 'transfer', referenceId: fromAccount.id,
        source: 'Points Transfer', notes: notes || `Received from customer ${fromCustomerId}`,
        createdBy,
      }, { transaction: txn });

      toAccount.availablePoints = toBalanceAfter;
      toAccount.lifetimeEarned = (toAccount.lifetimeEarned || 0) + points;
      toAccount.currentTierPoints = (toAccount.currentTierPoints || 0) + points;
      await toAccount.save({ transaction: txn });

      if (!externalTxn) await txn.commit();

      return { fromTransaction: transferOutTxn, toTransaction: transferInTxn, fromAccount, toAccount };
    } catch (err) {
      if (!externalTxn) await txn.rollback();
      throw err;
    }
  }
}

module.exports = new PointsEngineService();
