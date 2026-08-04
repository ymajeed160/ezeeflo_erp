const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const superAdminRepo = require('../repositories/SuperAdminRepository');
const { Announcement, SuperAdminCompany, User, SubscriptionPlan } = require('../models');
const { Op, Sequelize } = require('sequelize');

// ═══════════════════════════════ AUDIT LOGS ═══════════════════════════════

const listAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, entityType, superAdminId, search } = req.query;
    const result = await superAdminRepo.getAuditLogs({ page, limit, action, entityType, superAdminId });
    return ApiResponse.paginated(res, { data: result.data, pagination: result.pagination });
  } catch (error) {
    logger.error('List audit logs error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to fetch audit logs' });
  }
};

// ═══════════════════════════════ ANNOUNCEMENTS ═══════════════════════════════

const listAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const { count, rows } = await Announcement.findAndCountAll({
      order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return ApiResponse.paginated(res, { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to fetch announcements' });
  }
};

const getAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return ApiResponse.notFound(res, { message: 'Not found' });
    return ApiResponse.success(res, { data: a });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to fetch announcement' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.create({ ...req.body, createdBy: req.superAdminId });
    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId, action: 'CREATE_ANNOUNCEMENT', entityType: 'announcement',
      entityId: a.id, description: `Created announcement "${a.title}"`, ipAddress: req.ip,
    });
    return ApiResponse.created(res, { message: 'Announcement created', data: a });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to create announcement' });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return ApiResponse.notFound(res, { message: 'Not found' });
    await a.update({ ...req.body, updatedBy: req.superAdminId });
    return ApiResponse.success(res, { message: 'Updated', data: a });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to update' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.findByPk(req.params.id);
    if (!a) return ApiResponse.notFound(res, { message: 'Not found' });
    await a.destroy();
    return ApiResponse.success(res, { message: 'Deleted' });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Failed to delete' });
  }
};

// ═══════════════════════════════ REPORTS ═══════════════════════════════

const getReports = async (req, res) => {
  try {
    const { type = 'companies' } = req.query;

    switch (type) {
      case 'companies': {
        const companies = await SuperAdminCompany.findAll({ order: [['createdAt', 'DESC']] });
        const byStatus = {};
        companies.forEach(c => { byStatus[c.status] = (byStatus[c.status] || 0) + 1; });
        const byPlan = {};
        companies.forEach(c => { byPlan[c.subscriptionPlan || 'none'] = (byPlan[c.subscriptionPlan || 'none'] || 0) + 1; });
        return ApiResponse.success(res, { data: { companies, summary: { total: companies.length, byStatus, byPlan } } });
      }
      case 'admins': {
        const admins = await User.findAll({ where: { role: 'company_admin' }, order: [['createdAt', 'DESC']] });
        return ApiResponse.success(res, { data: { admins, summary: { total: admins.length, active: admins.filter(a => a.isActive).length } } });
      }
      case 'usage': {
        const totalEmployees = await User.count({ where: { role: 'employee' } });
        const totalUsers = await User.count();
        const totalCompanies = await SuperAdminCompany.count();
        const activeCompanies = await SuperAdminCompany.count({ where: { status: 'active' } });
        return ApiResponse.success(res, { data: { totalEmployees, totalUsers, totalCompanies, activeCompanies } });
      }
      case 'login_history': {
        const history = await superAdminRepo.getLoginHistory({ page: 1, limit: 100 });
        return ApiResponse.success(res, { data: history.data });
      }
      case 'subscriptions': {
        const companies = await SuperAdminCompany.findAll({
          attributes: ['subscriptionPlan', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
          group: ['subscriptionPlan'],
        });
        const plans = await SubscriptionPlan.findAll();
        return ApiResponse.success(res, { data: { byPlan: companies, plans } });
      }
      default:
        return ApiResponse.badRequest(res, { message: 'Invalid report type' });
    }
  } catch (error) {
    logger.error('Reports error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to generate report' });
  }
};

module.exports = {
  listAuditLogs,
  listAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getReports,
};
