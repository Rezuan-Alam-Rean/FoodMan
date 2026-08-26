import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/index.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // transform known error types into apierror
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    error = new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Validation Error', formattedErrors);
  } else if (err instanceof mongoose.Error.ValidationError) {
    const formattedErrors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, 'Database Validation Error', formattedErrors);
  } else if (err instanceof mongoose.Error.CastError) {
    error = new ApiError(HTTP_STATUS.BAD_REQUEST, `Invalid ${err.path}: ${err.value}`);
  } else if (err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    error = new ApiError(HTTP_STATUS.CONFLICT, `Duplicate value for field(s): ${fields.join(', ')}`);
  } else if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors && error.errors.length > 0 && { errors: error.errors }),
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  // log errors
  if (error.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${error.message}`, { stack: error.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${error.statusCode} - ${error.message}`);
  }

  res.status(error.statusCode).json(response);
};
