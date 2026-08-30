// authentication and role-based authorization middlewares
import { ApiError } from '../utils/apiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { verifyToken } from '../utils/jwt.js';
import { User } from '../modules/user/user.model.js';

/**
 * verify jwt bearer token and attach authenticated user to request
 */
export const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('authentication token is missing or invalid');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    throw ApiError.unauthorized('authentication token has expired or is invalid');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw ApiError.unauthorized('user belonging to this token no longer exists');
  }

  req.user = user;
  next();
});

/**
 * optional authentication middleware (attaches user if token exists, passes through if absent)
 */
export const optionalAuthenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
  } catch {
    // proceed without authenticated user on token failure
  }

  next();
});

/**
 * role-based authorization check
 * @param  {...string} roles 
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('authentication required');
    }

    if (roles.length && !roles.includes(req.user.role)) {
      throw ApiError.forbidden('you do not have permission to perform this action');
    }

    next();
  };
};
