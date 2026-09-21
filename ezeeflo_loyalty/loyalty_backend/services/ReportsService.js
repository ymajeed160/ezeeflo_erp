const { PointTransaction, LoyaltyAccount, Customer, RewardRedemption, Reward, Campaign, MembershipTier, Coupon, CouponUsage } = require('../models');
const { Op, Sequelize } = require('sequelize');

class ReportsService {
  /**
   * Customer Ledger - all points activity for a customer
   */
  async customerLedger(companyId, { customerId, startDate, endDate } = {}) {
    const where = { companyId };
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) { where.createdAt = {}; if (startDate) where.createdAt[Op.gte] = new Date(startDate); if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59.999Z'); }

    const transactions = await PointTransaction.findAll({
      where, include: [{ model: Customer, as: 'customer', attributes: ['id', 'code', 'firstName', 'lastName'], required: false }],
      order: [['createdAt', 'DESC']], limit: 500,
    });

    const summary = {
      totalEarned: transactions.filter(t => ['earn','bonus','welcome','referral','transfer_in'].includes(t.transactionType)).reduce((s,t)=>s+Math.abs(t.points),0),
      totalRedeemed: transactions.filter(t => ['redeem','transfer_out'].includes(t.transactionType)).reduce((s,t)=>s+Math.abs(t.points),0),
      totalExpired: transactions.filter(t => t.transactionType==='expire').reduce((s,t)=>s+Math.abs(t.points),0),
      totalAdjustments: transactions.filter(t => t.transactionType==='adjust').reduce((s,t)=>s+t.points,0),
    };

    return { transactions, summary };
  }

  /**
   * Points Expiry Report - points expiring soon
   */
  async pointsExpiry(companyId, { days = 30 } = {}) {
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const expiring = await PointTransaction.findAll({
      where: { companyId, transactionType: { [Op.in]: ['earn','bonus','welcome','referral'] }, expiresAt: { [Op.lte]: cutoff, [Op.gt]: new Date() } },
      include: [{ model: Customer, as: 'customer', attributes: ['id','code','firstName','lastName'] }, { model: LoyaltyAccount, as: 'loyaltyAccount', attributes: ['id','accountNumber','availablePoints'] }],
      order: [['expiresAt', 'ASC']],
    });

    const summary = { totalExpiringCustomers: new Set(expiring.map(t=>t.customerId)).size, totalExpiringPoints: expiring.reduce((s,t)=>s+t.points,0) };
    return { expiring, summary };
  }

  /**
   * Redeemed Rewards Report
   */
  async redeemedRewards(companyId, { startDate, endDate, rewardType } = {}) {
    const where = { companyId, status: { [Op.in]: ['fulfilled'] } };
    if (startDate || endDate) { where.createdAt = {}; if (startDate) where.createdAt[Op.gte] = new Date(startDate); if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59.999Z'); }

    const redemptions = await RewardRedemption.findAll({
      where, include: [
        { model: Reward, as: 'reward', attributes: ['id','name','code','rewardType','pointsRequired'], where: rewardType ? { rewardType } : {}, required: false },
        { model: Customer, as: 'customer', attributes: ['id','code','firstName','lastName'], required: false },
      ],
      order: [['createdAt', 'DESC']], limit: 500,
    });

    const summary = {
      totalRedemptions: redemptions.length,
      totalPointsRedeemed: redemptions.reduce((s,r)=>s+r.pointsRedeemed,0),
      totalValue: redemptions.reduce((s,r)=>s+(parseFloat(r.reward?.value||0)),0),
    };
    return { redemptions, summary };
  }

  /**
   * Campaign Performance Report
   */
  async campaignPerformance(companyId, { campaignId } = {}) {
    const where = { companyId };
    if (campaignId) where.id = campaignId;

    const campaigns = await Campaign.findAll({
      where, include: [{ model: Coupon, as: 'coupons', required: false }],
      order: [['createdAt', 'DESC']],
    });

    const results = [];
    for (const c of campaigns) {
      const txns = await PointTransaction.findAll({
        where: { campaignId: c.id, companyId },
        attributes: [[Sequelize.fn('SUM', Sequelize.col('points')), 'totalPoints'], [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
        raw: true,
      });
      const couponUsage = await CouponUsage.count({ where: { couponId: { [Op.in]: (c.coupons||[]).map(co=>co.id) } } });
      results.push({
        id: c.id, name: c.name, code: c.code, status: c.status, campaignType: c.campaignType,
        budget: parseFloat(c.budget||0), budgetSpent: parseFloat(c.budgetSpent||0),
        pointsIssued: Math.abs(parseInt(txns[0]?.totalPoints||0)),
        transactionCount: parseInt(txns[0]?.count||0),
        couponRedemptions: couponUsage,
        roi: c.budget > 0 ? ((Math.abs(parseInt(txns[0]?.totalPoints||0)) / parseFloat(c.budget)) * 100).toFixed(1) + '%' : 'N/A',
      });
    }
    return results;
  }

  /**
   * Top Customers by points
   */
  async topCustomers(companyId, { limit = 10, sortBy = 'points' } = {}) {
    const order = sortBy === 'visits' ? [['totalVisits', 'DESC']] : sortBy === 'value' ? [['lifetimeValue', 'DESC']] : [[Sequelize.literal('`loyaltyAccount`.`available_points`'), 'DESC']];

    return await Customer.findAll({
      where: { companyId, isActive: true },
      include: [{ model: LoyaltyAccount, as: 'loyaltyAccount', required: true, include: [{ model: MembershipTier, as: 'membership', required: false }] }],
      order, limit: parseInt(limit),
    });
  }

  /**
   * Inactive Customers Report
   */
  async inactiveCustomers(companyId, { days = 90 } = {}) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await Customer.findAll({
      where: { companyId, isActive: true, [Op.or]: [{ lastVisitDate: { [Op.lt]: cutoff } }, { lastVisitDate: null, createdAt: { [Op.lt]: cutoff } }] },
      include: [{ model: LoyaltyAccount, as: 'loyaltyAccount', attributes: ['id','accountNumber','availablePoints','lastActivityDate'], required: false }],
      order: [['lastVisitDate', 'ASC']], limit: 100,
    });
  }

  /**
   * Membership Distribution Report
   */
  async membershipReport(companyId) {
    const tiers = await MembershipTier.findAll({
      where: { companyId },
      include: [{ model: LoyaltyAccount, as: 'accounts', attributes: ['id','availablePoints','lifetimeEarned','lifetimeRedeemed'], required: false }],
      order: [['sortOrder', 'ASC']],
    });

    return tiers.map(t => ({
      name: t.name, code: t.code, color: t.color,
      customerCount: t.accounts?.length||0,
      totalPoints: t.accounts?.reduce((s,a)=>s+(a.availablePoints||0),0)||0,
      avgPoints: t.accounts?.length>0?Math.round(t.accounts.reduce((s,a)=>s+(a.availablePoints||0),0)/t.accounts.length):0,
      totalEarned: t.accounts?.reduce((s,a)=>s+(a.lifetimeEarned||0),0)||0,
      totalRedeemed: t.accounts?.reduce((s,a)=>s+(a.lifetimeRedeemed||0),0)||0,
    }));
  }

  /**
   * Revenue Impact - points to revenue correlation
   */
  async revenueImpact(companyId, { startDate, endDate } = {}) {
    const where = { companyId };
    if (startDate || endDate) { where.createdAt = {}; if (startDate) where.createdAt[Op.gte] = new Date(startDate); if (endDate) where.createdAt[Op.lte] = new Date(endDate + 'T23:59:59.999Z'); }

    const [pointsEarned, pointsRedeemed, totalCustomers, activeCustomers] = await Promise.all([
      PointTransaction.sum('points', { where: { ...where, transactionType: { [Op.in]: ['earn','bonus','welcome','referral'] } } }),
      PointTransaction.sum('points', { where: { ...where, transactionType: 'redeem' } }),
      Customer.count({ where: { companyId } }),
      Customer.count({ where: { companyId, isActive: true } }),
    ]);

    const totalRevenue = (Math.abs(pointsEarned||0) * 1); // 1 point ≈ 1 AED spent
    const redeemedValue = Math.abs(pointsRedeemed||0);
    const redemptionRate = totalRevenue > 0 ? ((redeemedValue / totalRevenue) * 100).toFixed(1) : 0;

    return {
      totalPointsEarned: Math.abs(pointsEarned||0), totalPointsRedeemed: redeemedValue,
      estimatedRevenue: totalRevenue, redemptionRate: parseFloat(redemptionRate),
      totalCustomers, activeCustomers, activeRate: totalCustomers>0?((activeCustomers/totalCustomers)*100).toFixed(1)+'%':'0%',
    };
  }
}

module.exports = new ReportsService();
