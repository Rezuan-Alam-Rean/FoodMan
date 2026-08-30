// authentication controller handlers
import {
  resolveGuestCheckoutAuth,
  registerUser,
  loginUser,
  getCurrentUserProfile,
} from './auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGuestCheckoutAuth = catchAsync(async (req, res) => {
  const result = await resolveGuestCheckoutAuth(req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'guest account resolved and authenticated successfully',
    data: result,
  });
});

export const handleRegister = catchAsync(async (req, res) => {
  const result = await registerUser(req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'user registered successfully',
    data: result,
  });
});

export const handleLogin = catchAsync(async (req, res) => {
  const result = await loginUser(req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'login successful',
    data: result,
  });
});

export const handleGetMe = catchAsync(async (req, res) => {
  const profile = await getCurrentUserProfile(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'profile retrieved successfully',
    data: profile,
  });
});
