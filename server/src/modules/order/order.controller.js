// order controller handlers
import {
  createNewOrder,
  getLiveOrderStatus,
  cancelOrder,
  getCustomerOrders,
  getRestaurantLiveOrders,
  riderAcceptOrder,
  restaurantAcceptAndCook,
  restaurantFoodReady,
  riderPickupOrder,
  riderDeliverOrder,
} from './order.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleCreateOrder = catchAsync(async (req, res) => {
  const result = await createNewOrder(req.body, req.user || null);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'order placed successfully',
    data: result,
  });
});

export const handleGetMyOrders = catchAsync(async (req, res) => {
  const result = await getCustomerOrders(req.user._id, req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'customer orders retrieved successfully',
    data: result,
  });
});

export const handleGetOrderStatus = catchAsync(async (req, res) => {
  const result = await getLiveOrderStatus(req.params.id, req.user || null);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'order status retrieved successfully',
    data: result,
  });
});

export const handleCancelOrder = catchAsync(async (req, res) => {
  const order = await cancelOrder(req.params.id, req.body.reason, req.user);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'order cancelled successfully',
    data: order,
  });
});

export const handleGetRestaurantLiveOrders = catchAsync(async (req, res) => {
  const orders = await getRestaurantLiveOrders(req.params.restaurantId, req.user);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'restaurant live orders retrieved successfully',
    data: orders,
  });
});

export const handleRiderAcceptOrder = catchAsync(async (req, res) => {
  const order = await riderAcceptOrder(req.params.id, req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'order accepted by rider successfully',
    data: order,
  });
});

export const handleRestaurantAcceptAndCook = catchAsync(async (req, res) => {
  const order = await restaurantAcceptAndCook(req.params.id, req.user);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'order accepted and cooking started; cancellation locked',
    data: order,
  });
});

export const handleRestaurantFoodReady = catchAsync(async (req, res) => {
  const order = await restaurantFoodReady(req.params.id, req.user);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'food marked ready for pickup',
    data: order,
  });
});

export const handleRiderPickupOrder = catchAsync(async (req, res) => {
  const order = await riderPickupOrder(req.params.id, req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'order marked picked up',
    data: order,
  });
});

export const handleRiderDeliverOrder = catchAsync(async (req, res) => {
  const order = await riderDeliverOrder(req.params.id, req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'order delivered successfully and earnings credited',
    data: order,
  });
});
