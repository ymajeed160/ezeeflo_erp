'use strict';
const { NotFoundError, BadRequestError, AppError, ConflictError, ValidationError, ForbiddenError, UnauthorizedError } = require('./appError');

/**
 * ApiError - a helper class with static factory methods.
 * Used by services like PurchaseOrderService which do:
 *   ApiError.notFound('message')
 *   ApiError.badRequest('message')
 */
class ApiError extends AppError {
  static notFound(message) {
    return new NotFoundError(message);
  }

  static badRequest(message) {
    return new BadRequestError(message);
  }

  static conflict(message) {
    return new ConflictError(message);
  }

  static forbidden(message) {
    return new ForbiddenError(message);
  }

  static unauthorized(message) {
    return new UnauthorizedError(message);
  }

  static validation(message, errors) {
    return new ValidationError(message, errors);
  }
}

module.exports = ApiError;