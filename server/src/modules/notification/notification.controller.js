// notification controller handlers
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notification.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGetMyNotifications = catchAsync(async (req, res) => {
  const result = await getUserNotifications(req.user._id, req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'notifications retrieved successfully',
    data: result,
  });
});

export const handleGetUnreadCount = catchAsync(async (req, res) => {
  const count = await getUnreadNotificationCount(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'unread count retrieved successfully',
    data: { unread_count: count },
  });
});

export const handleMarkAsRead = catchAsync(async (req, res) => {
  const result = await markNotificationAsRead(req.params.id, req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'notification marked as read',
    data: result,
  });
});

export const handleMarkAllAsRead = catchAsync(async (req, res) => {
  const result = await markAllNotificationsAsRead(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'all notifications marked as read',
    data: result,
  });
});
