const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const superAdminRepo = require('../repositories/SuperAdminRepository');
const { User } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * GET /api/superadmin/dashboard
 * Dashboard statistics for Super Admin
 */
const getDashboard = async (req, res) => {
  try {
    // Company counts
    const companyCounts = await superAdminRepo.getCompanyCounts();

    // User counts from HR users table
    const totalEmployees = await User.count({ where: { role: 'employee' } });
    const totalCompanyAdmins = await User.count({ where: { role: 'company_admin' } });
    const totalHRUsers = await User.count({ where: { role: ['hr_manager', 'hr_officer'] } });
    const totalPayrollUsers = await User.count({ where: { role: 'payroll_manager' } });
    const totalUsers = await User.count();

    // Active subscriptions (companies with status='active')
    const activeSubscriptions = companyCounts.active;
    const expiredSubscriptions = companyCounts.expired;

    // Recent activity (last 10 audit logs)
    const recentActivity = await superAdminRepo.getAuditLogs({ page: 1, limit: 10 });

    // Today's logins
    const todayLogins = await superAdminRepo.getTodayLoginCount();

    // Companies expiring in next 30 days
    const companiesExpiringSoon = companyCounts.expiringSoon;

    // Total super admins
    const totalSuperAdmins = (await superAdminRepo.findAll({ page: 1, limit: 1 })).pagination.total;

    return ApiResponse.success(res, {
      data: {
        companies: {
          total: companyCounts.total,
          active: companyCounts.active,
          inactive: companyCounts.inactive,
          suspended: companyCounts.suspended,
          expired: companyCounts.expired,
          pendingActivation: companyCounts.pending,
          archived: companyCounts.archived,
          expiringSoon: companiesExpiringSoon,
        },
        users: {
          totalEmployees,
          totalCompanyAdmins,
          totalHRUsers,
          totalPayrollUsers,
          totalUsers,
          totalSuperAdmins,
        },
        subscriptions: {
          active: activeSubscriptions,
          expired: expiredSubscriptions,
        },
        activity: {
          recentActivity: recentActivity.data,
          todayLogins,
        },
      },
    });
  } catch (error) {
    logger.error('Super Admin Dashboard error:', { error: error.message, stack: error.stack });
    return ApiResponse.error(res, { message: 'Failed to load dashboard' });
  }
};

module.exports = { getDashboard };
