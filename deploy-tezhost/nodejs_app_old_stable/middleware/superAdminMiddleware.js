const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');

/**
 * Super Admin Authentication Middleware
 * 
 * Flow:
 * 1. Validates JWT access token
 * 2. Loads user from database
 * 3. Checks isSuperAdmin flag
 * 4. Returns 403 Forbidden if user is not a super admin
 */
const superAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.unauthorized(res, { message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return ApiResponse.unauthorized(res, { message: 'Token expired' });
      }
      return ApiResponse.unauthorized(res, { message: 'Invalid token' });
    }

    const user = await User.scope('withPassword').findByPk(decoded.userId);
    if (!user) {
      return ApiResponse.unauthorized(res, { message: 'User not found' });
    }

    if (!user.isActive) {
      return ApiResponse.unauthorized(res, { message: 'Account is deactivated' });
    }

    if (user.isLocked) {
      return ApiResponse.unauthorized(res, { message: 'Account is locked. Contact administrator.' });
    }

    // CRITICAL: Only users with isSuperAdmin = true can access super admin routes
    if (!user.isSuperAdmin) {
      return ApiResponse.error(res, {
        message: 'Forbidden. Super Admin access required.',
        statusCode: 403,
      });
    }

    req.userId = user.id;
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: user.isSuperAdmin,
    };

    next();
  } catch (error) {
    return ApiResponse.error(res, { message: 'Authentication failed' });
  }
};

module.exports = { superAdminAuth };
