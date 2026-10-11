const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const sessionActivity = require('../utils/sessionActivity');

const authMiddleware = async (req, res, next) => {
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

    const user = await User.scope('withPassword').findByPk(decoded.userId, {
      attributes: { include: ['password', 'refreshToken'] },
    });
    if (!user) {
      return ApiResponse.unauthorized(res, { message: 'User not found' });
    }

    if (!user.isActive) {
      return ApiResponse.unauthorized(res, { message: 'Account is deactivated' });
    }

    if (user.isLocked) {
      return ApiResponse.unauthorized(res, { message: 'Account is locked. Contact administrator.' });
    }

    // Single active session: reject tokens issued before a newer login.
    if (decoded.sid && user.refreshToken && decoded.sid !== user.refreshToken) {
      return ApiResponse.unauthorized(res, {
        message: 'Session ended: your account was signed in from another browser',
      });
    }

    // Keep the session alive in the activity tracker (used by the single-session rule).
    sessionActivity.touch(decoded.sid);

    // Preserve tenant context if already set by companyMiddleware (runs before duplicate authMiddleware calls)
    const existingTenantId = req.tenantId || req.user?.tenantId;

    req.userId = user.id;
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      tenantId: existingTenantId || user.tenantId,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', { error: error.message });
    return ApiResponse.error(res, { message: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        tenantId: user.tenantId,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };