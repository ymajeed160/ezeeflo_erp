const { Company, CompanySubscription, SubscriptionPlan, User, Customer, PointTransaction } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../utils/appError');

class DashboardService {
  async getStats(companyId) {
    const [totalCustomers, activeMembers, totalPointsIssued, totalPointsRedeemed, totalUsers,
      customersThisMonth, pointsThisMonth, redemptionsThisMonth] = await Promise.all([
      Customer.count({ where: { companyId } }),
      Customer.count({ where: { companyId, isActive: true } }),
      PointTransaction.sum('points', { where: { companyId, transactionType: { [Op.in]: ['earn', 'bonus', 'welcome', 'referral'] } } }) || 0,
      PointTransaction.sum('points', { where: { companyId, transactionType: 'redeem' } }) || 0,
      User.count({ where: { companyId } }),
      Customer.count({
        where: { companyId, createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }),
      PointTransaction.sum('points', {
        where: { companyId, transactionType: { [Op.in]: ['earn', 'bonus', 'welcome', 'referral'] }, createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }) || 0,
      PointTransaction.sum('points', {
        where: { companyId, transactionType: 'redeem', createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
      }) || 0,
    ]);

    return {
      totalCustomers,
      activeMembers,
      totalPointsIssued,
      totalPointsRedeemed,
      totalUsers,
      customersThisMonth,
      pointsThisMonth,
      redemptionsThisMonth,
    };
  }

  async getSuperAdminStats() {
    const [totalCompanies, activeCompanies, trialCompanies, totalPlans,
      totalUsers, monthlyRevenue] = await Promise.all([
      Company.count(),
      Company.count({ where: { status: 'active' } }),
      Company.count({ where: { status: 'trial' } }),
      SubscriptionPlan.count({ where: { isActive: true } }),
      User.count(),
      Company.sum('subscription_status') || 0, // Placeholder for revenue calculation
    ]);

    return {
      totalCompanies, activeCompanies, trialCompanies,
      totalPlans, totalUsers,
      revenue: { monthly: 0, annual: 0 },
    };
  }
}

module.exports = new DashboardService();
