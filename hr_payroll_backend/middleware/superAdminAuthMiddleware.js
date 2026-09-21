const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const superAdminRepo = require('../repositories/SuperAdminRepository');

/**
 * Super Admin Auth Middleware
 * 
 * Validates JWT tokens for Super Admin access only.
 * Completely isolated from normal company user authentication.
 */
const SUPER_ADMIN_JWT_SECRET = process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'sa_4f8e2c9b1a6d3f7e0c5b8a2d9f1e4c7b';

const superAdminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, { message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, SUPER_ADMIN_JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return ApiResponse.unauthorized(res, { message: 'Token expired' });
      }
      return ApiResponse.unauthorized(res, { message: 'Invalid token' });
    }

    // Validate it's a super admin token
    if (!decoded.isSuperAdmin || !decoded.superAdminId) {
      return ApiResponse.forbidden(res, { message: 'Access denied: Super Admin only' });
    }

    // Verify super admin still exists and is active
    const superAdmin = await superAdminRepo.findById(decoded.superAdminId);
    if (!superAdmin) {
      return ApiResponse.unauthorized(res, { message: 'Super admin account not found' });
    }

    if (!superAdmin.isActive) {
      return ApiResponse.unauthorized(res, { message: 'Account is deactivated' });
    }

    if (superAdmin.isLocked) {
      return ApiResponse.unauthorized(res, { message: 'Account is locked. Contact administrator.' });
    }

    // Set request context
    req.superAdminId = superAdmin.id;
    req.superAdmin = {
      id: superAdmin.id,
      username: superAdmin.username,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
    };

    next();
  } catch (error) {
    logger.error('Super Admin Auth middleware error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Authentication failed' });
  }
};

module.exports = { superAdminAuthMiddleware, SUPER_ADMIN_JWT_SECRET };
