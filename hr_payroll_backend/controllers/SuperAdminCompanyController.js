const { Op } = require('sequelize');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const superAdminRepo = require('../repositories/SuperAdminRepository');
const { User } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * GET /api/superadmin/companies
 * List all companies with search, filter, pagination
 */
const listCompanies = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const result = await superAdminRepo.findAllCompanies({ page, limit, search, status, sortBy, sortOrder });

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: 'LIST_COMPANIES',
      entityType: 'company',
      description: 'Viewed company list',
      ipAddress: req.ip,
    });

    return ApiResponse.paginated(res, {
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error('List companies error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to fetch companies' });
  }
};

/**
 * GET /api/superadmin/companies/:id
 * Get single company
 */
const getCompany = async (req, res) => {
  try {
    const company = await superAdminRepo.findCompanyById(req.params.id);
    if (!company) return ApiResponse.notFound(res, { message: 'Company not found' });

    // Get company admin
    const admin = await User.findOne({ where: { role: 'company_admin' }, include: [{ model: require('../models').UserCompany, as: 'companies', where: { companyId: company.id } }] });

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: 'VIEW_COMPANY',
      entityType: 'company',
      entityId: company.id,
      description: `Viewed company "${company.name}"`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { data: { company, admin } });
  } catch (error) {
    logger.error('Get company error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to fetch company' });
  }
};

/**
 * POST /api/superadmin/companies
 * Create company with admin and default data
 */
const createCompany = async (req, res) => {
  try {
    const {
      // Company fields
      name, legalName, tradeLicenseNumber, taxRegistrationNumber,
      country, city, address, phone, email, website, logoUrl,
      timezone, currency, language, workingDays, financialYearStart,
      status, subscriptionPlan, subscriptionStartDate, subscriptionExpiryDate,
      maxEmployees, maxUsers, maxBranches, maxDepartments, maxPayrollRuns,
      storageLimitMb, maxApiRequests, gracePeriodDays, notes,

      // Admin fields
      adminFirstName, adminLastName, adminUsername, adminEmail, adminPhone,
      adminPassword, adminDepartment, adminBranch,
    } = req.body;

    // Validate required
    if (!name) return ApiResponse.badRequest(res, { message: 'Company name is required' });
    if (!adminFirstName || !adminLastName) return ApiResponse.badRequest(res, { message: 'Admin first and last name are required' });
    if (!adminEmail) return ApiResponse.badRequest(res, { message: 'Admin email is required' });

    // Check duplicate company
    if (email) {
      const existing = await superAdminRepo.findAllCompanies({ search: email, limit: 1 });
      if (existing.data.length > 0) {
        return ApiResponse.badRequest(res, { message: 'A company with this email already exists' });
      }
    }

    // Create company
    const company = await superAdminRepo.createCompany({
      name, legalName, tradeLicenseNumber, taxRegistrationNumber,
      country, city, address, phone, email, website, logoUrl,
      timezone: timezone || 'Asia/Dubai', currency: currency || 'AED',
      language: language || 'en', workingDays: workingDays || 'Mon,Tue,Wed,Thu,Fri',
      financialYearStart: financialYearStart || '01-01',
      status: status || 'pending_activation',
      subscriptionPlan: subscriptionPlan || 'starter',
      subscriptionStartDate, subscriptionExpiryDate,
      maxEmployees: maxEmployees || 50, maxUsers: maxUsers || 10,
      maxBranches: maxBranches || 5, maxDepartments: maxDepartments || 10,
      maxPayrollRuns: maxPayrollRuns || 12, storageLimitMb: storageLimitMb || 1024,
      maxApiRequests: maxApiRequests || 10000, gracePeriodDays: gracePeriodDays || 15,
      notes, createdBy: req.superAdminId,
    });

    // Create company admin user
    const hashedPassword = await bcrypt.hash(adminPassword || 'Welcome@123', 12);
    const adminUser = await User.create({
      username: adminUsername || adminEmail?.split('@')[0] || `admin_${company.id.substring(0, 8)}`,
      email: adminEmail,
      password: hashedPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      phone: adminPhone,
      role: 'company_admin',
      isActive: true,
      mustChangePassword: true,
      createdBy: req.superAdminId,
    });

    // Associate admin with company
    const { UserCompany } = require('../models');
    await UserCompany.create({
      userId: adminUser.id,
      companyId: company.id,
      isDefault: true,
    });

    // Initialize default data for the company (roles, permissions, settings, etc.)
    await initializeDefaultData(company.id, adminUser.id);

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: 'CREATE_COMPANY',
      entityType: 'company',
      entityId: company.id,
      description: `Created company "${company.name}" with admin ${adminEmail}`,
      newValues: { name, email, status: company.status },
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, {
      message: 'Company and administrator created successfully',
      data: {
        company,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          firstName: adminUser.firstName,
          lastName: adminUser.lastName,
        },
      },
    });
  } catch (error) {
    logger.error('Create company error:', { error: error.message, stack: error.stack });
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.badRequest(res, { message: 'A company or admin with these details already exists' });
    }
    return ApiResponse.error(res, { message: 'Failed to create company' });
  }
};

/**
 * PUT /api/superadmin/companies/:id
 * Update company
 */
const updateCompany = async (req, res) => {
  try {
    const company = await superAdminRepo.findCompanyById(req.params.id);
    if (!company) return ApiResponse.notFound(res, { message: 'Company not found' });

    const oldValues = { name: company.name, status: company.status };

    const updated = await superAdminRepo.updateCompany(req.params.id, {
      ...req.body,
      updatedBy: req.superAdminId,
    });

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: 'UPDATE_COMPANY',
      entityType: 'company',
      entityId: company.id,
      description: `Updated company "${company.name}"`,
      oldValues,
      newValues: { name: updated.name, status: updated.status },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { message: 'Company updated', data: updated });
  } catch (error) {
    logger.error('Update company error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to update company' });
  }
};

/**
 * PATCH /api/superadmin/companies/:id/status
 * Change company status (activate, deactivate, suspend, archive)
 */
const changeCompanyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'suspended', 'expired', 'pending_activation', 'archived'];
    if (!validStatuses.includes(status)) {
      return ApiResponse.badRequest(res, { message: `Invalid status. Must be: ${validStatuses.join(', ')}` });
    }

    const company = await superAdminRepo.findCompanyById(req.params.id);
    if (!company) return ApiResponse.notFound(res, { message: 'Company not found' });

    const oldStatus = company.status;
    const updated = await superAdminRepo.updateCompany(req.params.id, {
      status,
      updatedBy: req.superAdminId,
    });

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: `COMPANY_${status.toUpperCase()}`,
      entityType: 'company',
      entityId: company.id,
      description: `Changed company "${company.name}" status from ${oldStatus} to ${status}`,
      oldValues: { status: oldStatus },
      newValues: { status },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { message: `Company ${status}`, data: updated });
  } catch (error) {
    logger.error('Change company status error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to change company status' });
  }
};

/**
 * DELETE /api/superadmin/companies/:id
 * Soft delete company
 */
const deleteCompany = async (req, res) => {
  try {
    const company = await superAdminRepo.findCompanyById(req.params.id);
    if (!company) return ApiResponse.notFound(res, { message: 'Company not found' });

    await superAdminRepo.deleteCompany(req.params.id);

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: 'DELETE_COMPANY',
      entityType: 'company',
      entityId: company.id,
      description: `Soft-deleted company "${company.name}"`,
      oldValues: { name: company.name },
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { message: 'Company deleted' });
  } catch (error) {
    logger.error('Delete company error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to delete company' });
  }
};

/**
 * GET /api/superadmin/companies/:id/admins
 * Get admins for a company
 */
const getCompanyAdmins = async (req, res) => {
  try {
    const { UserCompany } = require('../models');
    const admins = await User.findAll({
      where: { role: 'company_admin' },
      include: [{ model: UserCompany, as: 'companies', where: { companyId: req.params.id } }],
    });

    return ApiResponse.success(res, { data: admins });
  } catch (error) {
    logger.error('Get company admins error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to fetch admins' });
  }
};

/**
 * GET /api/superadmin/companies/export
 * Export companies to Excel/CSV format
 */
const exportCompanies = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const result = await superAdminRepo.findAllCompanies({ page: 1, limit: 10000 });

    if (format === 'csv') {
      const headers = 'Name,Legal Name,Email,Phone,Country,City,Status,Subscription Plan,Max Employees,Max Users,Created At\n';
      const rows = result.data.map(c =>
        `"${c.name || ''}","${c.legalName || ''}","${c.email || ''}","${c.phone || ''}","${c.country || ''}","${c.city || ''}","${c.status || ''}","${c.subscriptionPlan || ''}","${c.maxEmployees || 0}","${c.maxUsers || 0}","${c.createdAt || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=companies_export.csv');
      return res.send(headers + rows);
    }

    await superAdminRepo.createAuditLog({
      superAdminId: req.superAdminId,
      action: 'EXPORT_COMPANIES',
      entityType: 'company',
      description: `Exported ${result.data.length} companies`,
      ipAddress: req.ip,
    });

    return ApiResponse.success(res, { data: result.data });
  } catch (error) {
    logger.error('Export companies error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to export companies' });
  }
};

/**
 * Initialize default data for a new company
 */
async function initializeDefaultData(companyId, adminUserId) {
  try {
    const db = require('../models');

    // Default departments
    const defaultDepartments = [
      { name: 'Administration', code: 'ADMIN', description: 'Administration Department', isActive: true, tenantId: companyId },
      { name: 'Human Resources', code: 'HR', description: 'Human Resources Department', isActive: true, tenantId: companyId },
      { name: 'Finance', code: 'FIN', description: 'Finance Department', isActive: true, tenantId: companyId },
      { name: 'Information Technology', code: 'IT', description: 'IT Department', isActive: true, tenantId: companyId },
      { name: 'Sales & Marketing', code: 'SALES', description: 'Sales & Marketing Department', isActive: true, tenantId: companyId },
      { name: 'Operations', code: 'OPS', description: 'Operations Department', isActive: true, tenantId: companyId },
    ];
    await db.Department.bulkCreate(defaultDepartments.map(d => ({ ...d, createdBy: adminUserId })));

    // Default branch
    await db.Branch.create({
      name: 'Head Office', code: 'HO', address: 'Main Office',
      city: 'Dubai', country: 'UAE', isActive: true, isDefault: true,
      tenantId: companyId, createdBy: adminUserId,
    });

    // Default designations
    const defaultDesignations = [
      { name: 'CEO', code: 'CEO', isActive: true, tenantId: companyId },
      { name: 'Manager', code: 'MGR', isActive: true, tenantId: companyId },
      { name: 'Supervisor', code: 'SUP', isActive: true, tenantId: companyId },
      { name: 'Officer', code: 'OFF', isActive: true, tenantId: companyId },
      { name: 'Assistant', code: 'AST', isActive: true, tenantId: companyId },
    ];
    await db.Designation.bulkCreate(defaultDesignations.map(d => ({ ...d, createdBy: adminUserId })));

    // Default leave types
    const defaultLeaveTypes = [
      { name: 'Annual Leave', code: 'ANNUAL', leaveCategory: 'Annual', maxDaysPerYear: 30, isPaid: true, requiresApproval: true, isActive: true, tenantId: companyId },
      { name: 'Sick Leave', code: 'SICK', leaveCategory: 'Sick', maxDaysPerYear: 15, isPaid: true, requiresApproval: true, isActive: true, tenantId: companyId },
      { name: 'Emergency Leave', code: 'EMERGENCY', leaveCategory: 'Emergency', maxDaysPerYear: 5, isPaid: true, requiresApproval: true, isActive: true, tenantId: companyId },
      { name: 'Maternity Leave', code: 'MATERNITY', leaveCategory: 'Maternity', maxDaysPerYear: 60, isPaid: true, requiresApproval: true, isActive: true, tenantId: companyId },
      { name: 'Unpaid Leave', code: 'UNPAID', leaveCategory: 'Unpaid', maxDaysPerYear: 30, isPaid: false, requiresApproval: true, isActive: true, tenantId: companyId },
    ];
    await db.LeaveType.bulkCreate(defaultLeaveTypes.map(l => ({ ...l, createdBy: adminUserId })));

    // Default roles
    const defaultRoles = [
      { name: 'HR Manager', code: 'hr_manager', description: 'Full HR access', isSystem: true, isActive: true },
      { name: 'Payroll Manager', code: 'payroll_manager', description: 'Payroll access', isSystem: true, isActive: true },
      { name: 'HR Officer', code: 'hr_officer', description: 'Limited HR access', isSystem: true, isActive: true },
      { name: 'Department Manager', code: 'department_manager', description: 'Department level access', isSystem: true, isActive: true },
      { name: 'Employee', code: 'employee', description: 'Self-service access', isSystem: true, isActive: true },
    ];
    await db.Role.bulkCreate(defaultRoles.map(r => ({ ...r, createdBy: adminUserId })));

    // Default settings
    await db.GeneralSetting.create({
      tenantId: companyId,
      companyName: 'New Company',
      defaultCurrency: 'AED',
      timezone: 'Asia/Dubai',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      financialYearStart: '01-01',
      companyWorkingDays: 'Mon,Tue,Wed,Thu,Fri',
      weekStartDay: 'Monday',
      createdBy: adminUserId,
    });

    logger.info(`Default data initialized for company ${companyId}`);
  } catch (error) {
    logger.error(`Failed to initialize default data for company ${companyId}:`, { error: error.message });
  }
}

module.exports = {
  listCompanies, getCompany, createCompany, updateCompany,
  changeCompanyStatus, deleteCompany, getCompanyAdmins, exportCompanies,
};
