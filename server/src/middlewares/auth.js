import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * authentication middleware placeholder
 */
export const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication token is missing or invalid');
  }

  const token = authHeader.split(' ')[1];
  // verify token here when auth logic is added
  req.user = { token };
  next();
});

/**
 * role-based authorization middleware placeholder
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
};
