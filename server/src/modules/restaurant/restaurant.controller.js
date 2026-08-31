// restaurant controller handlers
import {
  getAllRestaurants,
  getRestaurantDetails,
  createRestaurant,
  toggleRestaurantStatus,
  getMyRestaurant,
  updateRestaurantProfile,
} from './restaurant.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS, USER_ROLES } from '../../constants/index.js';

export const handleGetRestaurants = catchAsync(async (req, res) => {
  const restaurants = await getAllRestaurants(req.query);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'restaurants retrieved successfully',
    data: restaurants,
  });
});

export const handleGetRestaurantDetails = catchAsync(async (req, res) => {
  const restaurant = await getRestaurantDetails(req.params.idOrSlug);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'restaurant details retrieved successfully',
    data: restaurant,
  });
});

export const handleGetMyRestaurant = catchAsync(async (req, res) => {
  const restaurant = await getMyRestaurant(req.user._id);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'my restaurant retrieved successfully',
    data: restaurant,
  });
});

export const handleCreateRestaurant = catchAsync(async (req, res) => {
  const payload = { ...req.body };
  if (req.user.role === USER_ROLES.RESTAURANT_OWNER) {
    payload.owner_id = req.user._id;
  }
  const restaurant = await createRestaurant(payload);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'restaurant created successfully',
    data: restaurant,
  });
});

export const handleToggleRestaurantStatus = catchAsync(async (req, res) => {
  const restaurant = await toggleRestaurantStatus(
    req.params.id,
    req.body.is_open,
    req.user
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: `restaurant is now ${restaurant.is_open ? 'open' : 'closed'}`,
    data: restaurant,
  });
});

export const handleUpdateRestaurantProfile = catchAsync(async (req, res) => {
  const restaurant = await updateRestaurantProfile(
    req.params.id,
    req.body,
    req.user
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'restaurant profile updated successfully',
    data: restaurant,
  });
});

