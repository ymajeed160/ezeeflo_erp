const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

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

    req.userId = user.id;
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      companyId: user.companyId,
      firstName: user.firstName,
      lastName: user.lastName,
      isSuperAdmin: user.isSuperAdmin,
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
        companyId: user.companyId,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
      };
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = { authMiddleware, optionalAuth };
