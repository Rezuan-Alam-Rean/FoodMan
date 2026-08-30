// customer ratings and reviews business logic
import { Review } from './review.model.js';
import { Order } from '../order/order.model.js';
import { Restaurant } from '../restaurant/restaurant.model.js';
import { Rider } from '../rider/rider.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ORDER_STATUS } from '../../constants/index.js';

/**
 * submit order review for food and rider
 * @param {string} customerUserId
 * @param {object} payload
 * @returns {object}
 */
export const createOrderReview = async (
  customerUserId,
  {
    order_id,
    food_rating,
    food_review = '',
    rider_rating,
    rider_review = '',
  }
) => {
  const order = await Order.findById(order_id);
  if (!order) {
    throw ApiError.notFound('order not found');
  }

  if (order.customer_id.toString() !== customerUserId.toString()) {
    throw ApiError.forbidden('you can only review your own orders');
  }

  if (order.status !== ORDER_STATUS.DELIVERED) {
    throw ApiError.badRequest('you can only review orders that have been delivered');
  }

  const existingReview = await Review.findOne({ order_id });
  if (existingReview) {
    throw ApiError.conflict('a review has already been submitted for this order');
  }

  const review = await Review.create({
    order_id: order._id,
    customer_id: customerUserId,
    restaurant_id: order.restaurant_id,
    rider_id: order.rider_id || null,
    food_rating: food_rating ? Number(food_rating) : null,
    food_review: food_review ? food_review.trim() : '',
    rider_rating: rider_rating ? Number(rider_rating) : null,
    rider_review: rider_review ? rider_review.trim() : '',
  });

  // update restaurant average rating
  if (food_rating) {
    const restaurant = await Restaurant.findById(order.restaurant_id);
    if (restaurant) {
      const newTotal = (restaurant.total_ratings || 0) + 1;
      const currentAvg = restaurant.rating_avg || 0;
      restaurant.rating_avg = Number(
        ((currentAvg * (restaurant.total_ratings || 0) + Number(food_rating)) / newTotal).toFixed(1)
      );
      restaurant.total_ratings = newTotal;
      await restaurant.save();
    }
  }

  // update rider average rating
  if (rider_rating && order.rider_id) {
    const rider = await Rider.findById(order.rider_id);
    if (rider) {
      const currentAvg = rider.rating_avg || 0;
      rider.rating_avg = currentAvg === 0 ? Number(rider_rating) : Number(((currentAvg + Number(rider_rating)) / 2).toFixed(1));
      await rider.save();
    }
  }

  return review;
};

/**
 * get reviews for a restaurant
 * @param {string} restaurantId
 * @returns {Array}
 */
export const getRestaurantReviews = async (restaurantId) => {
  const reviews = await Review.find({ restaurant_id: restaurantId, food_rating: { $ne: null } })
    .populate('customer_id', 'name')
    .sort({ createdAt: -1 })
    .limit(30);

  return reviews;
};
