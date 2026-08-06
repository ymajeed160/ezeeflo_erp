const { PointTransaction, Customer, LoyaltyAccount, RewardRedemption, Campaign, MembershipTier, Company } = require('../models');
const { Op, Sequelize } = require('sequelize');

class AnalyticsService {
  /**
   * Dashboard summary - all key metrics
   */
  async getDashboard(companyId) {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalCustomers, activeCustomers, loyaltyAccounts, tierBreakdown,
      pointsThisMonth, pointsLastMonth, pointsTotal,
      redeemedThisMonth, redeemedLastMonth, redeemedTotal,
      campaigns, activeCampaigns, redemptionsThisMonth] = await Promise.all([
      Customer.count({ where: { companyId } }),
      Customer.count({ where: { companyId, isActive: true } }),
      LoyaltyAccount.count({ where: { companyId, isActive: true } }),
      MembershipTier.findAll({ where: { companyId, isActive: true }, include: [{ model: LoyaltyAccount, as: 'accounts', attributes: ['id'], where: { isActive: true }, required: false }], order: [['sortOrder','ASC']] }),
      PointTransaction.sum('points', { where: { companyId, transactionType: { [Op.in]: ['earn','bonus','welcome','referral'] }, createdAt: { [Op.gte]: thisMonth } } }),
      PointTransaction.sum('points', { where: { companyId, transactionType: { [Op.in]: ['earn','bonus','welcome','referral'] }, createdAt: { [Op.gte]: lastMonth, [Op.lt]: thisMonth } } }),
      PointTransaction.sum('points', { where: { companyId, transactionType: { [Op.in]: ['earn','bonus','welcome','referral'] } } }),
      PointTransaction.sum('points', { where: { companyId, transactionType: 'redeem', createdAt: { [Op.gte]: thisMonth } } }),
      PointTransaction.sum('points', { where: { companyId, transactionType: 'redeem', createdAt: { [Op.gte]: lastMonth, [Op.lt]: thisMonth } } }),
      PointTransaction.sum('points', { where: { companyId, transactionType: 'redeem' } }),
      Campaign.count({ where: { companyId } }),
      Campaign.count({ where: { companyId, status: 'active' } }),
      RewardRedemption.count({ where: { companyId, status: 'fulfilled', createdAt: { [Op.gte]: thisMonth } } }),
    ]);

    const pointsGrowth = pointsLastMonth ? (((Math.abs(pointsThisMonth||0) - Math.abs(pointsLastMonth||0)) / Math.abs(pointsLastMonth||0)) * 100).toFixed(1) : 0;
    const redeemGrowth = redeemedLastMonth ? (((Math.abs(redeemedThisMonth||0) - Math.abs(redeemedLastMonth||0)) / Math.abs(redeemedLastMonth||0)) * 100).toFixed(1) : 0;

    return {
      customers: { total: totalCustomers, active: activeCustomers, activeRate: totalCustomers>0?((activeCustomers/totalCustomers)*100).toFixed(1):0, enrolled: loyaltyAccounts },
      points: { thisMonth: Math.abs(pointsThisMonth||0), lastMonth: Math.abs(pointsLastMonth||0), total: Math.abs(pointsTotal||0), growth: parseFloat(pointsGrowth) },
      redemptions: { thisMonth: Math.abs(redeemedThisMonth||0), lastMonth: Math.abs(redeemedLastMonth||0), total: Math.abs(redeemedTotal||0), growth: parseFloat(redeemGrowth), rewardRedemptions: redemptionsThisMonth },
      campaigns: { total: campaigns, active: activeCampaigns },
      tiers: tierBreakdown.map(t => ({ name: t.name, code: t.code, color: t.color, count: t.accounts?.length||0 })),
    };
  }

  /**
   * Monthly trend data for charts
   */
  async getMonthlyTrends(companyId, { months = 12 } = {}) {
    const trends = [];
    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
      const end = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);

      const [earned, redeemed, newCustomers] = await Promise.all([
        PointTransaction.sum('points', { where: { companyId, transactionType: { [Op.in]: ['earn','bonus','welcome','referral'] }, createdAt: { [Op.gte]: start, [Op.lte]: end } } }),
        PointTransaction.sum('points', { where: { companyId, transactionType: 'redeem', createdAt: { [Op.gte]: start, [Op.lte]: end } } }),
        Customer.count({ where: { companyId, createdAt: { [Op.gte]: start, [Op.lte]: end } } }),
      ]);

      trends.push({
        month: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
        earned: Math.abs(earned || 0), redeemed: Math.abs(redeemed || 0),
        newCustomers: newCustomers || 0,
      });
    }
    return trends;
  }

  /**
   * Top campaigns by performance
   */
  async getTopCampaigns(companyId, { limit = 5 } = {}) {
    const campaigns = await Campaign.findAll({
      where: { companyId },
      order: [['budgetSpent', 'DESC']],
      limit: parseInt(limit),
    });

    const results = [];
    for (const c of campaigns) {
      const txns = await PointTransaction.findAll({
        where: { campaignId: c.id, companyId },
        attributes: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'count'], [Sequelize.fn('SUM', Sequelize.col('points')), 'points']],
        raw: true,
      });
      results.push({
        name: c.name, type: c.campaignType, status: c.status,
        transactions: parseInt(txns[0]?.count||0), pointsIssued: Math.abs(parseInt(txns[0]?.points||0)),
        budget: parseFloat(c.budget||0), budgetSpent: parseFloat(c.budgetSpent||0),
      });
    }
    return results;
  }

  /**
   * Customer growth over time
   */
  async getCustomerGrowth(companyId, { months = 12 } = {}) {
    const data = [];
    for (let i = months - 1; i >= 0; i--) {
      const end = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
      const total = await Customer.count({ where: { companyId, createdAt: { [Op.lte]: end } } });
      const month = end.toLocaleString('default', { month: 'short' });
      data.push({ month, total });
    }
    return data;
  }
}

module.exports = new AnalyticsService();
