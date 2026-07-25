const logger = require('../utils/logger');
const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, _next) => {
  logger.error('Unhandled Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    user: req.user?.username,
  });

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors?.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiResponse.badRequest(res, {
      message: 'Validation Error',
      errors,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, { message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, { message: 'Token expired' });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return ApiResponse.badRequest(res, { message: 'File too large' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return ApiResponse.badRequest(res, { message: 'Unexpected file field' });
  }

  // Custom operational errors
  if (err.isOperational) {
    return ApiResponse.error(res, {
      message: err.message,
      statusCode: err.statusCode,
      errors: err.errors,
    });
  }

  // Unknown errors
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message;

  return ApiResponse.error(res, { message, statusCode });
};

module.exports = errorHandler;