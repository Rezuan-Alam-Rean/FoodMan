// coupon controller handlers
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  getCouponsByRestaurant,
  validateCoupon,
} from './coupon.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleCreateCoupon = catchAsync(async (req, res) => {
  const coupon = await createCoupon(req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'Coupon created successfully',
    data: coupon,
  });
});

export const handleGetCoupons = catchAsync(async (req, res) => {
  const data = await getCoupons(req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Coupons retrieved successfully',
    data,
  });
});

export const handleGetCouponById = catchAsync(async (req, res) => {
  const coupon = await getCouponById(req.params.id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Coupon details retrieved successfully',
    data: coupon,
  });
});

export const handleUpdateCoupon = catchAsync(async (req, res) => {
  const coupon = await updateCoupon(req.params.id, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Coupon updated successfully',
    data: coupon,
  });
});

export const handleToggleCouponStatus = catchAsync(async (req, res) => {
  const coupon = await toggleCouponStatus(req.params.id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: `Coupon status updated to ${coupon.is_active ? 'active' : 'inactive'}`,
    data: coupon,
  });
});

export const handleDeleteCoupon = catchAsync(async (req, res) => {
  await deleteCoupon(req.params.id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Coupon deleted successfully',
    data: null,
  });
});

export const handleGetCouponsByRestaurant = catchAsync(async (req, res) => {
  const coupons = await getCouponsByRestaurant(req.params.restaurantId);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'Restaurant promo coupons retrieved',
    data: coupons,
  });
});

export const handleValidateCoupon = catchAsync(async (req, res) => {
  const result = await validateCoupon({
    code: req.body.code,
    restaurant_id: req.body.restaurant_id,
    customer_id: req.user?._id || req.body.customer_id,
    food_subtotal: req.body.food_subtotal,
  });

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: result.message,
    data: result,
  });
});
