const { Op } = require('sequelize');
const { SuperAdmin, SuperAdminCompany, SuperAdminLoginHistory, SuperAdminAuditLog } = require('../models');
const bcrypt = require('bcryptjs');

class SuperAdminRepository {
  // ── Find ──
  async findById(id) {
    return SuperAdmin.findByPk(id);
  }

  async findByEmail(email) {
    return SuperAdmin.scope('withPassword').findOne({ where: { email } });
  }

  async findByUsername(username) {
    return SuperAdmin.scope('withPassword').findOne({ where: { username } });
  }

  async findByRefreshToken(refreshToken) {
    return SuperAdmin.scope('withRefreshToken').findOne({ where: { refreshToken } });
  }

  async findAll({ page = 1, limit = 10, search = '', isActive }) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await SuperAdmin.findAndCountAll({
      where, order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) } };
  }

  // ── Create / Update ──
  async create(data) {
    if (data.password) data.password = await bcrypt.hash(data.password, 12);
    return SuperAdmin.create(data);
  }

  async update(id, data) {
    const superAdmin = await SuperAdmin.findByPk(id);
    if (!superAdmin) return null;
    if (data.password) data.password = await bcrypt.hash(data.password, 12);
    await superAdmin.update(data);
    return superAdmin;
  }

  async delete(id) {
    const superAdmin = await SuperAdmin.findByPk(id);
    if (!superAdmin) return null;
    await superAdmin.destroy();
    return { success: true };
  }

  // ── Account Management ──
  async lockAccount(id) {
    return SuperAdmin.update({ isLocked: true, lockedAt: new Date() }, { where: { id } });
  }

  async unlockAccount(id) {
    return SuperAdmin.update({ isLocked: false, lockedAt: null, loginAttempts: 0 }, { where: { id } });
  }

  async incrementLoginAttempts(id) {
    const sa = await SuperAdmin.findByPk(id);
    if (!sa) return null;
    const attempts = sa.loginAttempts + 1;
    const locked = attempts >= 5;
    await sa.update({ loginAttempts: attempts, isLocked: locked, lockedAt: locked ? new Date() : null });
    return sa;
  }

  async recordLogin(id, ip) {
    return SuperAdmin.update({ lastLoginAt: new Date(), lastLoginIp: ip, loginAttempts: 0 }, { where: { id } });
  }

  async updateRefreshToken(id, refreshToken) {
    return SuperAdmin.update({ refreshToken }, { where: { id } });
  }

  async clearRefreshToken(id) {
    return SuperAdmin.update({ refreshToken: null }, { where: { id } });
  }

  // ── Login History ──
  async createLoginHistory(data) {
    return SuperAdminLoginHistory.create(data);
  }

  async updateLoginHistory(id, data) {
    const record = await SuperAdminLoginHistory.findByPk(id);
    if (!record) return null;
    return record.update(data);
  }

  async getLoginHistory({ superAdminId, page = 1, limit = 20 }) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (superAdminId) where.superAdminId = superAdminId;
    const { count, rows } = await SuperAdminLoginHistory.findAndCountAll({
      where,
      include: [{ model: SuperAdmin, as: 'superAdmin', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }],
      order: [['loginAt', 'DESC']],
      offset, limit: parseInt(limit),
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) } };
  }

  async getTodayLoginCount() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return SuperAdminLoginHistory.count({
      where: { loginAt: { [Op.gte]: today }, isSuccess: true },
    });
  }

  // ── Audit Logs ──
  async createAuditLog(data) {
    return SuperAdminAuditLog.create(data);
  }

  async getAuditLogs({ page = 1, limit = 20, action, entityType, superAdminId }) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (superAdminId) where.superAdminId = superAdminId;
    const { count, rows } = await SuperAdminAuditLog.findAndCountAll({
      where,
      include: [{ model: SuperAdmin, as: 'superAdmin', attributes: ['id', 'username', 'email', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
      offset, limit: parseInt(limit),
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) } };
  }

  // ── Company ──
  async findCompanyById(id) {
    return SuperAdminCompany.findByPk(id);
  }

  async findAllCompanies({ page = 1, limit = 10, search = '', status, sortBy = 'createdAt', sortOrder = 'DESC' }) {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { legalName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { tradeLicenseNumber: { [Op.like]: `%${search}%` } },
      ];
    }
    const allowedSort = ['name', 'email', 'status', 'subscriptionPlan', 'maxEmployees', 'maxUsers', 'createdAt', 'subscriptionExpiryDate'];
    const order = allowedSort.includes(sortBy) ? [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']] : [['createdAt', 'DESC']];
    const { count, rows } = await SuperAdminCompany.findAndCountAll({
      where, order, offset, limit: parseInt(limit), distinct: true,
    });
    return { data: rows, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / parseInt(limit)) } };
  }

  async createCompany(data) {
    return SuperAdminCompany.create(data);
  }

  async updateCompany(id, data) {
    const company = await SuperAdminCompany.findByPk(id);
    if (!company) return null;
    await company.update(data);
    return company;
  }

  async deleteCompany(id) {
    const company = await SuperAdminCompany.findByPk(id);
    if (!company) return null;
    await company.destroy();
    return { success: true };
  }

  async getCompanyCounts() {
    const total = await SuperAdminCompany.count();
    const active = await SuperAdminCompany.count({ where: { status: 'active' } });
    const inactive = await SuperAdminCompany.count({ where: { status: 'inactive' } });
    const suspended = await SuperAdminCompany.count({ where: { status: 'suspended' } });
    const expired = await SuperAdminCompany.count({ where: { status: 'expired' } });
    const pending = await SuperAdminCompany.count({ where: { status: 'pending_activation' } });
    const archived = await SuperAdminCompany.count({ where: { status: 'archived' } });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringSoon = await SuperAdminCompany.count({
      where: {
        status: 'active',
        subscriptionExpiryDate: { [Op.between]: [new Date(), thirtyDaysFromNow] },
      },
    });

    return { total, active, inactive, suspended, expired, pending, archived, expiringSoon };
  }
}

module.exports = new SuperAdminRepository();
