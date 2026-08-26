import { HTTP_STATUS } from '../constants/index.js';

export class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.isOperational = true;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = 'Bad Request', errors = []) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  static unauthorized(message = 'Unauthorized', errors = []) {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }

  static forbidden(message = 'Forbidden', errors = []) {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, errors);
  }

  static notFound(message = 'Resource Not Found', errors = []) {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, errors);
  }

  static conflict(message = 'Conflict', errors = []) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, errors);
  }

  static unprocessable(message = 'Unprocessable Entity', errors = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  static internal(message = 'Internal Server Error', errors = []) {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors);
  }

  static serviceUnavailable(message = 'Service Unavailable', errors = []) {
    return new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, message, errors);
  }
}
