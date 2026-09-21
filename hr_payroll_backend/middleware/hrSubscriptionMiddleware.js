const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * HR Subscription Middleware
 * Validates company context. Subscription check bypassed in dev mode.
 */
const hrSubscriptionMiddleware = async (req, res, next) => {
  try {
    const companyId = req.tenantId;
    if (!companyId) {
      return ApiResponse.badRequest(res, { message: 'Company context required' });
    }
    // Skip ERP subscription check — HR runs standalone
    next();
  } catch (error) {
    logger.error('HR Subscription middleware error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Failed to validate subscription' });
  }
};

module.exports = { hrSubscriptionMiddleware };
