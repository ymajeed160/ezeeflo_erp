const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors?.map(e => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.badRequest(res, {
      message: 'Validation failed',
      errors: errors || [{ message: err.message }],
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, { message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, { message: 'Token expired' });
  }

  // Known operational errors
  if (err.isOperational) {
    return ApiResponse.error(res, {
      message: err.message,
      statusCode: err.statusCode || 500,
      errors: err.errors,
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return ApiResponse.error(res, { message, statusCode });
};

module.exports = errorHandler;
