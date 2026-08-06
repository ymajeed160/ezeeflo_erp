const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Super Admin middleware - checks if user has isSuperAdmin=true
 */
const superAdminMiddleware = async (req, res, next) => {
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
      return ApiResponse.unauthorized(res, { message: 'Invalid or expired token' });
    }

    const user = await User.scope('withPassword').findByPk(decoded.userId);
    if (!user) return ApiResponse.unauthorized(res, { message: 'User not found' });
    if (!user.isSuperAdmin) return ApiResponse.forbidden(res, { message: 'Super admin access required' });
    if (!user.isActive) return ApiResponse.unauthorized(res, { message: 'Account deactivated' });

    req.userId = user.id;
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      companyId: user.companyId,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: true,
    };

    next();
  } catch (error) {
    logger.error('Super admin middleware error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Authorization failed' });
  }
};

module.exports = superAdminMiddleware;
