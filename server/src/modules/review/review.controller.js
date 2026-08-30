// review controller handlers
import { createOrderReview, getRestaurantReviews } from './review.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { HTTP_STATUS } from '../../constants/index.js';

export const handleCreateReview = catchAsync(async (req, res) => {
  const review = await createOrderReview(req.user._id, req.body);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.CREATED,
    message: 'review submitted successfully',
    data: review,
  });
});

export const handleGetRestaurantReviews = catchAsync(async (req, res) => {
  const reviews = await getRestaurantReviews(req.params.restaurantId);

  return ApiResponse.success(res, {
    statusCode: HTTP_STATUS.OK,
    message: 'restaurant reviews retrieved successfully',
    data: reviews,
  });
});
