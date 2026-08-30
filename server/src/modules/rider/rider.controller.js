// rider controller handlers
import {
  getRiderProfile,
  toggleRiderOnlineStatus,
  updateRiderAssignedZones,
  getAvailableZoneOrders,
} from './rider.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGetRiderProfile = catchAsync(async (req, res) => {
  const profile = await getRiderProfile(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'rider profile retrieved successfully',
    data: profile,
  });
});

export const handleToggleOnlineStatus = catchAsync(async (req, res) => {
  const rider = await toggleRiderOnlineStatus(req.user._id, req.body.is_online);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: `rider is now ${rider.is_online ? 'online' : 'offline'}`,
    data: rider,
  });
});

export const handleUpdateAssignedZones = catchAsync(async (req, res) => {
  const rider = await updateRiderAssignedZones(req.user._id, req.body.zone_ids);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'assigned delivery zones updated successfully',
    data: rider,
  });
});

export const handleGetAvailableZoneOrders = catchAsync(async (req, res) => {
  const orders = await getAvailableZoneOrders(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'available zone orders retrieved successfully',
    data: orders,
  });
});
