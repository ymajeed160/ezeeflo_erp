const { UserTenant } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Middleware to validate and set the current company context.
 *
 * Reads the company ID from (in priority order):
 *  1. X-Company-Id header
 *  2. companyId query parameter (proxy-safe — survives Apache/Nginx proxying)
 *  3. req.companyId (set by previous middleware if needed)
 *
 * Validates that the authenticated user has access to the company.
 * Sets req.companyId, req.tenantId, and req.user.tenantId on success.
 */
const companyMiddleware = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId || req.companyId;

    if (!companyId) {
      return ApiResponse.badRequest(res, {
        message: 'Company ID is required. Set X-Company-Id header.',
      });
    }

    if (!req.user || !req.user.id) {
      return ApiResponse.unauthorized(res, { message: 'Authentication required' });
    }

    // Validate that the user has access to this company
    const access = await UserTenant.findOne({
      where: {
        userId: req.user.id,
        tenantId: companyId,
      },
    });

    if (!access) {
      logger.warn(`User ${req.user.id} attempted to access company ${companyId} without permission`);
      return ApiResponse.forbidden(res, {
        message: 'You do not have access to this company',
      });
    }

    // Set company context on the request
    req.companyId = companyId;
    req.company = {
      id: companyId,
    };

    // Override tenantId for backward compatibility with all existing controllers
    // that use req.user.tenantId or req.tenantId for data filtering.
    // This ensures the active company is used for ALL data queries.
    req.tenantId = companyId;
    req.user = { ...req.user, tenantId: companyId };

    next();
  } catch (error) {
    logger.error('Company middleware error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to validate company access' });
  }
};

/**
 * Optional company middleware — does not reject if no company is set,
 * but will validate if one is provided.
 */
const optionalCompanyMiddleware = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.companyId;

    if (!companyId || !req.user || !req.user.id) {
      return next();
    }

    const access = await UserTenant.findOne({
      where: {
        userId: req.user.id,
        tenantId: companyId,
      },
    });

    if (access) {
      req.companyId = companyId;
      req.company = { id: companyId };
      req.tenantId = companyId;
      req.user = { ...req.user, tenantId: companyId };
    }

    next();
  } catch (error) {
    // Fail open for optional middleware
    next();
  }
};

module.exports = { companyMiddleware, optionalCompanyMiddleware };
