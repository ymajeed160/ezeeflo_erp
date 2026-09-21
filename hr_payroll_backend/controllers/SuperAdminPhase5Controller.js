const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const superAdminRepo = require('../repositories/SuperAdminRepository');
const { User, UserCompany, SuperAdminCompany } = require('../models');
const { Op } = require('sequelize');

// ═══════════════════ COMPANY ADMINISTRATORS ═══════════════════

const listAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;
    const where = { role: 'company_admin' };
    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows } = await User.findAndCountAll({
      where, include: [{ model: UserCompany, as: 'companies', required: false }],
      order: [['createdAt', 'DESC']], offset, limit: parseInt(limit), distinct: true,
    });

    const enriched = await Promise.all(rows.map(async (admin) => {
      const companyIds = (admin.companies || []).map(c => c.companyId);
      const companies = companyIds.length > 0
        ? await SuperAdminCompany.findAll({ where: { id: companyIds }, attributes: ['id', 'name', 'status'] })
        : [];
      return { ...admin.toJSON(), companyDetails: companies };
    }));

    return ApiResponse.paginated(res, { data: enriched, pagination: { page: parseInt(page), limit: parseInt(limit), total: count, totalPages: Math.ceil(count / limit) } });
  } catch (error) {
    logger.error('List admins error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to fetch admins' });
  }
};

const resetAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const password = newPassword || 'Welcome@123';

    const user = await User.findByPk(id);
    if (!user) return ApiResponse.notFound(res, { message: 'User not found' });

    const hashed = await bcrypt.hash(password, 12);
    await user.update({ password: hashed, mustChangePassword: true, loginAttempts: 0, isLocked: false });

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId, action: 'PASSWORD_RESET', entityType: 'user',
      entityId: user.id, description: `Reset password for admin "${user.email}"`, ipAddress: req.ip,
    });

    return ApiResponse.success(res, { message: 'Password reset', data: { tempPassword: password } });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Password reset failed' });
  }
};

const toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // lock, unlock, activate, deactivate
    const user = await User.findByPk(id);
    if (!user) return ApiResponse.notFound(res, { message: 'User not found' });

    const updates = {};
    if (action === 'lock') updates.isLocked = true;
    else if (action === 'unlock') { updates.isLocked = false; updates.loginAttempts = 0; }
    else if (action === 'activate') updates.isActive = true;
    else if (action === 'deactivate') updates.isActive = false;

    await user.update(updates);

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId, action: `ADMIN_${action.toUpperCase()}`,
      entityType: 'user', entityId: user.id,
      description: `${action} admin "${user.email}"`, ipAddress: req.ip,
    });

    return ApiResponse.success(res, { message: `Admin ${action}ed`, data: user });
  } catch (error) {
    return ApiResponse.error(res, { message: 'Action failed' });
  }
};

// ═══════════════════ IMPERSONATION ═══════════════════

const impersonateCompany = async (req, res) => {
  try {
    const { companyId } = req.body;
    const company = await SuperAdminCompany.findByPk(companyId);
    if (!company) return ApiResponse.notFound(res, { message: 'Company not found' });

    // Find company admin
    const userCompany = await UserCompany.findOne({ where: { companyId }, include: [{ model: User, as: 'user', where: { role: 'company_admin' } }] });
    const admin = userCompany?.user;
    if (!admin) return ApiResponse.notFound(res, { message: 'No company admin found for this company' });

    // Generate impersonation JWT
    const impersonationToken = jwt.sign(
      {
        userId: admin.id,
        role: 'company_admin',
        tenantId: companyId,
        impersonatedBy: req.superAdminId,
        isImpersonation: true,
      },
      process.env.JWT_SECRET || '1e94259d8cf4146c849a1192f5f7460fa024b58fbda0b47015487dd21bb7fd87',
      { expiresIn: '2h' }
    );

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId, action: 'IMPERSONATION',
      entityType: 'company', entityId: companyId,
      description: `Impersonated company "${company.name}" as admin "${admin.email}"`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, {
      message: 'Impersonation token generated',
      data: {
        impersonationToken,
        redirectUrl: `/hr/dashboard`,
        admin: { id: admin.id, email: admin.email, firstName: admin.firstName, lastName: admin.lastName },
        company: { id: company.id, name: company.name },
      },
    });
  } catch (error) {
    logger.error('Impersonation error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Impersonation failed' });
  }
};

// ═══════════════════ EMAIL TEMPLATES ═══════════════════

const DEFAULT_TEMPLATES = [
  { code: 'welcome', name: 'Welcome Email', subject: 'Welcome to EzeeFlo HR & Payroll', body: '<p>Dear {{name}},</p><p>Welcome to EzeeFlo HR & Payroll. Your account has been created.</p><p>Username: {{username}}<br>Password: {{password}}</p>' },
  { code: 'password_reset', name: 'Password Reset', subject: 'Password Reset Request', body: '<p>Your password has been reset.</p><p>New Password: {{password}}</p>' },
  { code: 'subscription_expiring', name: 'Subscription Expiring', subject: 'Subscription Expiring Soon', body: '<p>Dear {{name}},</p><p>Your subscription for {{company}} will expire on {{expiryDate}}.</p>' },
  { code: 'subscription_expired', name: 'Subscription Expired', subject: 'Subscription Expired', body: '<p>Dear {{name}},</p><p>Your subscription has expired. Please renew to continue.</p>' },
  { code: 'company_suspended', name: 'Company Suspended', subject: 'Account Suspended', body: '<p>Dear {{name}},</p><p>Your account for {{company}} has been suspended. Contact support.</p>' },
  { code: 'company_activated', name: 'Company Activated', subject: 'Account Activated', body: '<p>Dear {{name}},</p><p>Your account for {{company}} has been activated.</p>' },
];

const listEmailTemplates = async (req, res) => {
  return ApiResponse.success(res, { data: DEFAULT_TEMPLATES });
};

const getEmailTemplate = async (req, res) => {
  const t = DEFAULT_TEMPLATES.find(t => t.code === req.params.code);
  if (!t) return ApiResponse.notFound(res, { message: 'Template not found' });
  return ApiResponse.success(res, { data: t });
};

const updateEmailTemplate = async (req, res) => {
  const t = DEFAULT_TEMPLATES.find(t => t.code === req.params.code);
  if (!t) return ApiResponse.notFound(res, { message: 'Template not found' });
  Object.assign(t, req.body);
  return ApiResponse.success(res, { message: 'Template updated', data: t });
};

// ═══════════════════ SETTINGS ═══════════════════

let superAdminSettings = {
  passwordPolicy: { minLength: 8, requireUppercase: true, requireNumber: true, requireSpecial: false },
  sessionTimeout: 720, // minutes (12 hours)
  maxLoginAttempts: 5,
  lockoutDuration: 30, // minutes
  mfaEnabled: false,
  notifications: { emailOnCompanyCreate: true, emailOnSuspension: true, emailOnExpiry: true },
};

const getSettings = async (req, res) => {
  return ApiResponse.success(res, { data: superAdminSettings });
};

const updateSettings = async (req, res) => {
  superAdminSettings = { ...superAdminSettings, ...req.body };
  await superAdminRepo.createAuditLog({
    superAdminId: req.superAdminId, action: 'UPDATE_SETTINGS',
    entityType: 'settings', description: 'Updated super admin settings', ipAddress: req.ip,
  });
  return ApiResponse.success(res, { message: 'Settings updated', data: superAdminSettings });
};

module.exports = {
  listAdmins, resetAdminPassword, toggleAdminStatus,
  impersonateCompany,
  listEmailTemplates, getEmailTemplate, updateEmailTemplate,
  getSettings, updateSettings,
};
