const { Badge, CustomerBadge, CustomerStreak, Customer, LoyaltyAccount } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

class GamificationService {
  // Badges CRUD
  async getAllBadges(companyId) {
    return await Badge.findAll({ where: { companyId }, order: [['name', 'ASC']] });
  }

  async createBadge(data, companyId, userId) {
    if (typeof data.criteria === 'string') { try { data.criteria = JSON.parse(data.criteria); } catch {} }
    return await Badge.create({ id: uuidv4(), ...data, companyId, createdBy: userId });
  }

  async updateBadge(id, data, companyId) {
    const badge = await Badge.findOne({ where: { id, companyId } });
    if (!badge) throw new (require('../utils/appError').NotFoundError)('Badge not found');
    if (typeof data.criteria === 'string') { try { data.criteria = JSON.parse(data.criteria); } catch {} }
    await badge.update(data);
    return badge;
  }

  async deleteBadge(id, companyId) {
    await Badge.destroy({ where: { id, companyId } });
  }

  // Customer badges
  async getCustomerBadges(customerId, companyId) {
    return await CustomerBadge.findAll({
      where: { customerId, companyId },
      include: [{ model: Badge, as: 'badge' }],
      order: [['earnedAt', 'DESC']],
    });
  }

  async checkAndAwardBadges(customerId, companyId) {
    const badges = await Badge.findAll({ where: { companyId, isActive: true } });
    const customer = await Customer.findByPk(customerId, {
      include: [{ model: LoyaltyAccount, as: 'loyaltyAccount' }],
    });
    if (!customer) return [];

    const awarded = [];
    for (const badge of badges) {
      const existing = await CustomerBadge.findOne({ where: { customerId, badgeId: badge.id, isCompleted: true } });
      if (existing) continue;

      if (this._evaluateBadgeCriteria(badge.criteria, customer)) {
        await CustomerBadge.create({ id: uuidv4(), companyId, customerId, badgeId: badge.id, earnedAt: new Date(), progress: 100, progressTarget: 100, isCompleted: true, completedAt: new Date() });
        if (badge.pointsReward > 0) {
          const account = await LoyaltyAccount.findOne({ where: { customerId, companyId } });
          if (account) {
            account.availablePoints += badge.pointsReward;
            account.lifetimeEarned += badge.pointsReward;
            account.currentTierPoints += badge.pointsReward;
            await account.save();
          }
        }
        awarded.push({ badge: badge.name, pointsAwarded: badge.pointsReward });
      }
    }
    return awarded;
  }

  _evaluateBadgeCriteria(criteria, customer) {
    if (!criteria) return false;
    const account = customer.loyaltyAccount;
    switch (criteria.type) {
      case 'purchase_count': return customer.totalVisits >= (criteria.value || 0);
      case 'points_earned': return (account?.lifetimeEarned || 0) >= (criteria.value || 0);
      case 'referral_count': return true; // would check referral table
      case 'membership_tier': return (account?.membership?.code || '') === criteria.value;
      default: return false;
    }
  }

  // Streaks
  async getCustomerStreaks(customerId, companyId) {
    return await CustomerStreak.findAll({ where: { customerId, companyId, isActive: true } });
  }

  async recordActivity(customerId, companyId, streakType) {
    let streak = await CustomerStreak.findOne({ where: { customerId, companyId, streakType } });
    const today = new Date().toISOString().slice(0, 10);

    if (!streak) {
      streak = await CustomerStreak.create({ id: uuidv4(), companyId, customerId, streakType, currentStreak: 1, longestStreak: 1, lastActivityDate: today });
    } else {
      const lastDate = streak.lastActivityDate;
      const diffDays = Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return streak; // Already recorded today
      if (diffDays === 1) {
        streak.currentStreak += 1;
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
      } else {
        streak.currentStreak = 1; // Reset streak
      }
      streak.lastActivityDate = today;
      await streak.save();
    }
    return streak;
  }

  async getStreakReward(streakType, currentStreak) {
    const rewards = { daily_login: [{ days: 7, points: 50 }, { days: 30, points: 200 }, { days: 90, points: 500 }], daily_purchase: [{ days: 5, points: 100 }, { days: 10, points: 300 }] };
    const typeRewards = rewards[streakType] || [];
    return typeRewards.find(r => r.days <= currentStreak);
  }
}

module.exports = new GamificationService();
