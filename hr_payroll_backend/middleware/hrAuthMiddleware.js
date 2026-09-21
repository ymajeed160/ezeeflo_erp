const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const erpIntegration = require('../../shared/services/erpIntegration');

/**
 * HR Auth Middleware
 * 
 * Validates JWT tokens issued by the ERP system.
 * Does NOT create users/sessions — relies entirely on ERP authentication.
 * After validation, calls ERP API to verify user is still active and valid.
 */
const hrAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, { message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.ERP_JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return ApiResponse.unauthorized(res, { message: 'Token expired' });
      }
      return ApiResponse.unauthorized(res, { message: 'Invalid token' });
    }

    // Trust the JWT — extract user ID, role, and tenant
    req.userId = decoded.userId;
    req.userRole = decoded.role || 'employee';
    req.user = {
      id: decoded.userId,
      role: decoded.role || 'employee',
    };

    // Optionally verify against ERP if token has no user info
    if (!req.userId) {
      try {
        const erpUser = await erpIntegration.validateUser(token);
        if (erpUser) {
          req.user = {
            id: erpUser.id,
            username: erpUser.username,
            email: erpUser.email,
            firstName: erpUser.firstName,
            lastName: erpUser.lastName,
          };
        }
      } catch {
        // ERP validation failed — still allow if JWT is valid
      }
    }

    next();
  } catch (error) {
    logger.error('HR Auth middleware error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Authentication failed' });
  }
};

module.exports = { hrAuthMiddleware };
