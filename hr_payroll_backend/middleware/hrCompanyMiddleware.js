const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * HR Company Middleware
 * Validates X-Company-Id header and sets req.tenantId.
 * Trusts the token — no ERP validation needed for HR-issued tokens.
 */
const hrCompanyMiddleware = async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] || req.query.companyId;

    if (!companyId) {
      return ApiResponse.badRequest(res, {
        message: 'Company ID is required. Set X-Company-Id header.',
      });
    }

    if (!req.user || !req.user.id) {
      return ApiResponse.unauthorized(res, { message: 'Authentication required' });
    }

    req.tenantId = companyId;
    req.companyId = companyId;
    next();
  } catch (error) {
    logger.error('HR Company middleware error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to validate company access' });
  }
};

module.exports = { hrCompanyMiddleware };
