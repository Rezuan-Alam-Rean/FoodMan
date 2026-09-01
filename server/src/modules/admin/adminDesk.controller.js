import {
  getAdminDeskMetricCounts,
  getPendingMfsPayments,
  verifyManualMfsPayment,
} from './adminDesk.service.js';
import {
  getAdminUsersList,
  getAdminCustomerDetails,
  getAdminRiderDetails,
  getAdminRestaurantDetails,
  getAdminUserDetails,
  createAdminUser,
  updateAdminUser,
} from './adminUsers.service.js';
import { getAdminAllOrders, adminCancelOrder } from '../order/order.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleGetAdminDeskCounts = catchAsync(async (req, res) => {
  const counts = await getAdminDeskMetricCounts();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'admin desk counts retrieved successfully',
    data: counts,
  });
});

export const handleGetPendingMfsPayments = catchAsync(async (req, res) => {
  const payments = await getPendingMfsPayments();

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'pending mfs payments retrieved successfully',
    data: payments,
  });
});

export const handleVerifyMfsPayment = catchAsync(async (req, res) => {
  const result = await verifyManualMfsPayment(
    req.params.paymentId,
    req.body.status,
    req.user._id,
    req.body.notes
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: `payment ${req.body.status.toLowerCase()} successfully`,
    data: result,
  });
});

export const handleGetAdminUsersList = catchAsync(async (req, res) => {
  const result = await getAdminUsersList(req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'admin users list retrieved successfully',
    data: {
      users: result.users,
      pagination: result.pagination,
    },
  });
});

export const handleGetCustomerDetails = catchAsync(async (req, res) => {
  const result = await getAdminCustomerDetails(req.params.id, req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'customer details and order history retrieved successfully',
    data: result,
  });
});

export const handleGetRiderDetails = catchAsync(async (req, res) => {
  const result = await getAdminRiderDetails(req.params.id, req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'rider details and delivery history retrieved successfully',
    data: result,
  });
});

export const handleGetRestaurantDetails = catchAsync(async (req, res) => {
  const result = await getAdminRestaurantDetails(req.params.id, req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'restaurant details and order history retrieved successfully',
    data: result,
  });
});

export const handleGetUserDetails = catchAsync(async (req, res) => {
  const result = await getAdminUserDetails(req.params.id, req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'user details retrieved successfully',
    data: result,
  });
});

export const handleCreateAdminUser = catchAsync(async (req, res) => {
  const result = await createAdminUser(req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: `${req.body.role || 'User'} created successfully`,
    data: result,
  });
});

export const handleUpdateAdminUser = catchAsync(async (req, res) => {
  const result = await updateAdminUser(req.params.id, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'user updated successfully',
    data: result,
  });
});

export const handleGetAdminOrders = catchAsync(async (req, res) => {
  const result = await getAdminAllOrders(req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'orders retrieved successfully',
    data: result,
  });
});
export const handleAdminCancelOrder = catchAsync(async (req, res) => {
  const order = await adminCancelOrder(req.params.id, req.body.reason);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'order cancelled by admin successfully',
    data: { order },
  });
});
