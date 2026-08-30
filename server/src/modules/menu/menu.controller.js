// menu controller handlers
import {
  createMenuCategory,
  updateMenuCategory,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from './menu.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleCreateCategory = catchAsync(async (req, res) => {
  const category = await createMenuCategory(
    req.params.restaurantId,
    req.body,
    req.user
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'category created successfully',
    data: category,
  });
});

export const handleUpdateCategory = catchAsync(async (req, res) => {
  const category = await updateMenuCategory(
    req.params.categoryId,
    req.body,
    req.user
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'category updated successfully',
    data: category,
  });
});

export const handleCreateFoodItem = catchAsync(async (req, res) => {
  const foodItem = await createFoodItem(
    req.params.restaurantId,
    req.body,
    req.user
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'food item created successfully',
    data: foodItem,
  });
});

export const handleUpdateFoodItem = catchAsync(async (req, res) => {
  const foodItem = await updateFoodItem(
    req.params.itemId,
    req.body,
    req.user
  );

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'food item updated successfully',
    data: foodItem,
  });
});

export const handleDeleteFoodItem = catchAsync(async (req, res) => {
  await deleteFoodItem(req.params.itemId, req.user);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'food item deleted successfully',
    data: null,
  });
});
