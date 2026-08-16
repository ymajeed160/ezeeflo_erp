const companyRepository = require('../repositories/CompanyRepository');
const companySeedService = require('./CompanySeedService');
const { Tenant, UserTenant } = require('../models');
const { NotFoundError, BadRequestError, ForbiddenError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');

class CompanyService {
  /**
   * Get all companies assigned to the logged-in user
   */
  async getUserCompanies(userId) {
    const companies = await companyRepository.findUserCompanies(userId);
    return companies.map(c => ({
      id: c.id,
      name: c.name,
      code: c.subdomain,
      email: c.email,
      phone: c.phone,
      logo: c.logo,
      currency: c.currencyCode,
      country: c.country,
      timezone: c.timezone,
      isActive: c.isActive,
      isDefault: c.UserTenants && c.UserTenants.length > 0 ? c.UserTenants[0].isDefault : false,
    }));
  }

  /**
   * Get current company details
   */
  async getCompanyById(tenantId, userId) {
    // Verify user has access
    const hasAccess = await companyRepository.userHasCompanyAccess(userId, tenantId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this company');
    }

    const tenant = await companyRepository.findByIdWithDetails(tenantId);
    if (!tenant) {
      throw new NotFoundError('Company not found');
    }
    return tenant;
  }

  /**
   * Select/switch to a company
   */
  async selectCompany(tenantId, userId) {
    const hasAccess = await companyRepository.userHasCompanyAccess(userId, tenantId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this company');
    }

    const tenant = await companyRepository.findByIdWithDetails(tenantId);
    if (!tenant) {
      throw new NotFoundError('Company not found');
    }

    if (!tenant.isActive) {
      throw new BadRequestError('This company is inactive');
    }

    // Set as default company
    await companyRepository.setDefaultCompany(userId, tenantId);

    logger.info(`User ${userId} selected company ${tenantId}`);

    return {
      id: tenant.id,
      name: tenant.name,
      code: tenant.subdomain,
      email: tenant.email,
      phone: tenant.phone,
      logo: tenant.logo,
      currency: tenant.currencyCode,
      country: tenant.country,
      timezone: tenant.timezone,
      isActive: tenant.isActive,
    };
  }

  /**
   * Create a new company
   */
  async createCompany(data, userId) {
    // Check subdomain uniqueness
    if (data.subdomain) {
      const existing = await companyRepository.findBySubdomain(data.subdomain);
      if (existing) {
        throw new ConflictError(`Company code "${data.subdomain}" is already taken`);
      }
    }

    const companyData = {
      name: data.name,
      subdomain: data.subdomain || data.name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50),
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      postalCode: data.postalCode || '',
      logo: data.logo || null,
      currencyCode: data.currency || 'AED',
      timezone: data.timezone || '+04:00',
      dateFormat: data.dateFormat || 'DD/MM/YYYY',
      fiscalYearStart: data.fiscalYearStart || '01-01',
      fiscalYearEnd: data.fiscalYearEnd || '12-31',
      isActive: true,
      subscriptionPlan: data.subscriptionPlan || 'trial',
      maxUsers: data.maxUsers || 10,
      createdBy: userId,
      updatedBy: userId,
    };

    const tenant = await companyRepository.create(companyData, null, userId);

    // Assign the creator to this company
    await companyRepository.assignUserToCompany(userId, tenant.id, userId);

    // Set as default if it's the user's only company
    const userCompanies = await companyRepository.findUserCompanyIds(userId);
    if (userCompanies.length === 1) {
      await companyRepository.setDefaultCompany(userId, tenant.id);
    }

    logger.info(`Company created: ${tenant.id} (${tenant.name}) by user ${userId}`);

    // Seed all default data for the new company
    try {
      await companySeedService.seedAll(tenant.id, userId);
    } catch (seedError) {
      logger.error(`Failed to seed default data for company ${tenant.id}:`, seedError.message);
      // Non-blocking: company is created even if seeding fails partially
    }

    return {
      id: tenant.id,
      name: tenant.name,
      code: tenant.subdomain,
      email: tenant.email,
      currency: tenant.currencyCode,
      isActive: tenant.isActive,
    };
  }

  /**
   * Update a company
   */
  async updateCompany(tenantId, data, userId) {
    // Verify user has access
    const hasAccess = await companyRepository.userHasCompanyAccess(userId, tenantId);
    if (!hasAccess) {
      throw new ForbiddenError('You do not have access to this company');
    }

    const tenant = await companyRepository.findByIdWithDetails(tenantId);
    if (!tenant) {
      throw new NotFoundError('Company not found');
    }

    // Check subdomain uniqueness if changed
    if (data.subdomain && data.subdomain !== tenant.subdomain) {
      const existing = await companyRepository.findBySubdomain(data.subdomain);
      if (existing) {
        throw new ConflictError(`Company code "${data.subdomain}" is already taken`);
      }
    }

    const updated = await companyRepository.update(tenantId, data, null, userId);
    logger.info(`Company updated: ${tenantId} by user ${userId}`);
    return updated;
  }

  /**
   * Get user count for a company
   */
  async getUserCompanyCount(tenantId) {
    return await UserTenant.count({ where: { tenantId } });
  }
}

module.exports = new CompanyService();
