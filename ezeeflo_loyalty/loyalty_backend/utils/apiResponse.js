const { StatusCodes } = require('http-status-codes');

class ApiResponse {
  static success(res, { data = null, message = 'Success', statusCode = StatusCodes.OK, meta = null }) {
    const response = { success: true, message, data };
    if (meta) response.meta = meta;
    return res.status(statusCode).json(response);
  }

  static created(res, { data = null, message = 'Created successfully' }) {
    return ApiResponse.success(res, { data, message, statusCode: StatusCodes.CREATED });
  }

  static paginated(res, { data, pagination, message = 'Success' }) {
    return ApiResponse.success(res, {
      data,
      message,
      meta: {
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          hasNext: pagination.hasNext,
          hasPrev: pagination.hasPrev,
        },
      },
    });
  }

  static error(res, { message = 'Internal Server Error', statusCode = StatusCodes.INTERNAL_SERVER_ERROR, errors = null }) {
    const response = { success: false, message };
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static badRequest(res, { message = 'Bad Request', errors = null }) {
    return ApiResponse.error(res, { message, statusCode: StatusCodes.BAD_REQUEST, errors });
  }

  static unauthorized(res, { message = 'Unauthorized' }) {
    return ApiResponse.error(res, { message, statusCode: StatusCodes.UNAUTHORIZED });
  }

  static forbidden(res, { message = 'Forbidden' }) {
    return ApiResponse.error(res, { message, statusCode: StatusCodes.FORBIDDEN });
  }

  static notFound(res, { message = 'Not Found' }) {
    return ApiResponse.error(res, { message, statusCode: StatusCodes.NOT_FOUND });
  }

  static conflict(res, { message = 'Conflict', errors = null }) {
    return ApiResponse.error(res, { message, statusCode: StatusCodes.CONFLICT, errors });
  }

  static tooMany(res, { message = 'Too many requests' }) {
    return ApiResponse.error(res, { message, statusCode: StatusCodes.TOO_MANY_REQUESTS });
  }
}

module.exports = ApiResponse;
