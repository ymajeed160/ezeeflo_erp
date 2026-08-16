const tenantRepository = require('../repositories/TenantRepository');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/appError');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class TenantService {
  async getMyTenant(tenantId) {
    const tenant = await tenantRepository.findByIdWithDetails(tenantId);
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }
    return tenant;
  }

  async updateTenant(tenantId, data, userId) {
    const tenant = await tenantRepository.findByIdWithDetails(tenantId);
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    // If subdomain is being changed, check uniqueness
    if (data.subdomain && data.subdomain !== tenant.subdomain) {
      const existing = await tenantRepository.findBySubdomain(data.subdomain);
      if (existing) {
        throw new ConflictError(`Subdomain "${data.subdomain}" is already taken`);
      }
    }

    const updated = await tenantRepository.update(tenantId, data, null, userId);
    logger.info(`Tenant updated: ${tenantId} by user ${userId}`);
    return updated;
  }

  async uploadLogo(tenantId, file, userId) {
    const tenant = await tenantRepository.findByIdWithDetails(tenantId);
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    // Delete old logo file if it exists
    if (tenant.logo) {
      const oldLogoPath = path.join(__dirname, '..', tenant.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Store relative path to the uploaded file
    const logoPath = `uploads/${file.filename}`;
    const updated = await tenantRepository.update(tenantId, { logo: logoPath }, null, userId);
    logger.info(`Tenant logo updated for tenant ${tenantId} by user ${userId}`);
    return updated;
  }

  async removeLogo(tenantId, userId) {
    const tenant = await tenantRepository.findByIdWithDetails(tenantId);
    if (!tenant) {
      throw new NotFoundError('Tenant not found');
    }

    if (tenant.logo) {
      const logoPath = path.join(__dirname, '..', tenant.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    const updated = await tenantRepository.update(tenantId, { logo: null }, null, userId);
    logger.info(`Tenant logo removed for tenant ${tenantId} by user ${userId}`);
    return updated;
  }
}

module.exports = new TenantService();