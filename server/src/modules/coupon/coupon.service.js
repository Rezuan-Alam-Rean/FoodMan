// coupon management and discount calculation service
import { Coupon } from './coupon.model.js';
import { Restaurant } from '../restaurant/restaurant.model.js';
import { Order } from '../order/order.model.js';
import { ApiError } from '../../utils/apiError.js';
import { HTTP_STATUS, ORDER_STATUS } from '../../constants/index.js';

/**
 * create a new coupon for a specific restaurant
 * @param {object} payload
 * @returns {Promise<Coupon>}
 */
export const createCoupon = async (payload) => {
  const {
    code,
    restaurant_id,
    title,
    description,
    discount_type = 'PERCENTAGE',
    discount_value,
    min_order_amount = 0,
    max_discount_amount = null,
    start_date,
    expiry_date,
    usage_limit = null,
    usage_limit_per_user = null,
    is_active = true,
  } = payload;

  if (!code || !code.trim()) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Coupon code is required');
  }

  if (!restaurant_id) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Target restaurant is required');
  }

  if (typeof discount_value !== 'number' || discount_value <= 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Discount value must be greater than 0');
  }

  if (discount_type === 'PERCENTAGE' && discount_value > 100) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Percentage discount cannot exceed 100%');
  }

  const normalizedCode = code.trim().toUpperCase();

  // verify restaurant exists
  const restaurant = await Restaurant.findById(restaurant_id);
  if (!restaurant) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Selected restaurant not found');
  }

  // check duplicate code for this restaurant
  const existing = await Coupon.findOne({ restaurant_id, code: normalizedCode });
  if (existing) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Coupon code "${normalizedCode}" already exists for ${restaurant.name}`
    );
  }

  const coupon = await Coupon.create({
    code: normalizedCode,
    restaurant_id,
    title: title ? title.trim() : `${normalizedCode} Promo`,
    description: description ? description.trim() : '',
    discount_type,
    discount_value,
    min_order_amount: Math.max(0, Number(min_order_amount) || 0),
    max_discount_amount:
      max_discount_amount !== null && max_discount_amount !== undefined && max_discount_amount !== ''
        ? Math.max(0, Number(max_discount_amount))
        : null,
    start_date: start_date ? new Date(start_date) : new Date(),
    expiry_date: expiry_date ? new Date(expiry_date) : null,
    usage_limit: usage_limit ? Math.max(1, parseInt(usage_limit, 10)) : null,
    usage_limit_per_user: usage_limit_per_user ? Math.max(1, parseInt(usage_limit_per_user, 10)) : null,
    is_active: Boolean(is_active),
  });

  return coupon.populate('restaurant_id', 'name slug logo_url address');
};

/**
 * list coupons with filtering, search and pagination for admin
 * @param {object} queryParams
 * @returns {Promise<object>}
 */
export const getCoupons = async (queryParams = {}) => {
  const {
    restaurant_id,
    is_active,
    search,
    page = 1,
    limit = 20,
  } = queryParams;

  const filter = {};

  if (restaurant_id) {
    filter.restaurant_id = restaurant_id;
  }

  if (is_active !== undefined && is_active !== '') {
    filter.is_active = is_active === 'true' || is_active === true;
  }

  if (search && search.trim()) {
    filter.code = { $regex: search.trim(), $options: 'i' };
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (p - 1) * l;

  const [total, coupons] = await Promise.all([
    Coupon.countDocuments(filter),
    Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('restaurant_id', 'name slug logo_url address'),
  ]);

  return {
    coupons,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l) || 1,
      hasNextPage: p * l < total,
      hasPrevPage: p > 1,
    },
  };
};

/**
 * get coupon by ID
 * @param {string} couponId
 * @returns {Promise<Coupon>}
 */
export const getCouponById = async (couponId) => {
  const coupon = await Coupon.findById(couponId).populate('restaurant_id', 'name slug logo_url address');
  if (!coupon) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Coupon not found');
  }
  return coupon;
};

/**
 * update coupon details
 * @param {string} couponId
 * @param {object} payload
 * @returns {Promise<Coupon>}
 */
export const updateCoupon = async (couponId, payload) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Coupon not found');
  }

  if (payload.code && payload.code.trim()) {
    const normalizedCode = payload.code.trim().toUpperCase();
    if (normalizedCode !== coupon.code) {
      const restId = payload.restaurant_id || coupon.restaurant_id;
      const existing = await Coupon.findOne({
        restaurant_id: restId,
        code: normalizedCode,
        _id: { $ne: couponId },
      });
      if (existing) {
        throw new ApiError(
          HTTP_STATUS.BAD_REQUEST,
          `Coupon code "${normalizedCode}" is already in use for this restaurant`
        );
      }
      coupon.code = normalizedCode;
    }
  }

  if (payload.restaurant_id) {
    const rest = await Restaurant.findById(payload.restaurant_id);
    if (!rest) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Restaurant not found');
    }
    coupon.restaurant_id = payload.restaurant_id;
  }

  if (payload.title !== undefined) coupon.title = payload.title.trim();
  if (payload.description !== undefined) coupon.description = payload.description.trim();
  if (payload.discount_type) coupon.discount_type = payload.discount_type;

  if (payload.discount_value !== undefined) {
    const val = Number(payload.discount_value);
    if (isNaN(val) || val <= 0) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Discount value must be greater than 0');
    }
    if (coupon.discount_type === 'PERCENTAGE' && val > 100) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Percentage discount cannot exceed 100%');
    }
    coupon.discount_value = val;
  }

  if (payload.min_order_amount !== undefined) {
    coupon.min_order_amount = Math.max(0, Number(payload.min_order_amount) || 0);
  }

  if (payload.max_discount_amount !== undefined) {
    coupon.max_discount_amount =
      payload.max_discount_amount !== null && payload.max_discount_amount !== ''
        ? Math.max(0, Number(payload.max_discount_amount))
        : null;
  }

  if (payload.start_date !== undefined) {
    coupon.start_date = payload.start_date ? new Date(payload.start_date) : new Date();
  }

  if (payload.expiry_date !== undefined) {
    coupon.expiry_date = payload.expiry_date ? new Date(payload.expiry_date) : null;
  }

  if (payload.usage_limit !== undefined) {
    coupon.usage_limit = payload.usage_limit ? Math.max(1, parseInt(payload.usage_limit, 10)) : null;
  }

  if (payload.usage_limit_per_user !== undefined) {
    coupon.usage_limit_per_user = payload.usage_limit_per_user
      ? Math.max(1, parseInt(payload.usage_limit_per_user, 10))
      : null;
  }

  if (payload.is_active !== undefined) {
    coupon.is_active = Boolean(payload.is_active);
  }

  await coupon.save();
  return coupon.populate('restaurant_id', 'name slug logo_url address');
};

/**
 * toggle active status of a coupon
 * @param {string} couponId
 * @returns {Promise<Coupon>}
 */
export const toggleCouponStatus = async (couponId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Coupon not found');
  }

  coupon.is_active = !coupon.is_active;
  await coupon.save();
  return coupon.populate('restaurant_id', 'name slug logo_url address');
};

/**
 * delete coupon
 * @param {string} couponId
 * @returns {Promise<boolean>}
 */
export const deleteCoupon = async (couponId) => {
  const coupon = await Coupon.findByIdAndDelete(couponId);
  if (!coupon) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Coupon not found');
  }
  return true;
};

/**
 * get active promotional coupons for customer display for a specific restaurant
 * @param {string} restaurantId
 * @returns {Promise<Coupon[]>}
 */
export const getCouponsByRestaurant = async (restaurantId) => {
  const now = new Date();
  const coupons = await Coupon.find({
    restaurant_id: restaurantId,
    is_active: true,
    $or: [{ expiry_date: null }, { expiry_date: { $gte: now } }],
  })
    .sort({ discount_value: -1 })
    .limit(10);

  return coupons;
};

/**
 * validate coupon against checkout rules
 * @param {object} params
 * @param {string} params.code
 * @param {string} params.restaurant_id
 * @param {string} [params.customer_id]
 * @param {number} params.food_subtotal
 * @returns {Promise<object>}
 */
export const validateCoupon = async ({ code, restaurant_id, customer_id, food_subtotal }) => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Coupon code is required');
  }

  if (!restaurant_id) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Restaurant reference is required');
  }

  const subtotal = Number(food_subtotal) || 0;
  if (subtotal <= 0) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Order food subtotal must be greater than 0');
  }

  // lookup coupon specifically for this restaurant
  const coupon = await Coupon.findOne({
    restaurant_id,
    code: normalizedCode,
  });

  if (!coupon) {
    // check if coupon belongs to a different restaurant for user clarity
    const otherRestaurantCoupon = await Coupon.findOne({ code: normalizedCode }).populate(
      'restaurant_id',
      'name'
    );
    if (otherRestaurantCoupon) {
      const restName = otherRestaurantCoupon.restaurant_id?.name || 'another restaurant';
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        `Coupon "${normalizedCode}" is only valid for orders from ${restName}`
      );
    }
    throw new ApiError(HTTP_STATUS.NOT_FOUND, `Invalid coupon code "${normalizedCode}"`);
  }

  if (!coupon.is_active) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This coupon is currently inactive');
  }

  const now = new Date();
  if (coupon.start_date && new Date(coupon.start_date) > now) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This coupon promotion has not started yet');
  }

  if (coupon.expiry_date && new Date(coupon.expiry_date) < now) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'This coupon has expired');
  }

  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Coupon usage limit has been reached');
  }

  if (coupon.min_order_amount > 0 && subtotal < coupon.min_order_amount) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      `Minimum order bill of ৳${coupon.min_order_amount} is required to apply this coupon`
    );
  }

  if (coupon.usage_limit_per_user && customer_id) {
    const userUsageCount = await Order.countDocuments({
      customer_id,
      coupon_id: coupon._id,
      status: { $ne: ORDER_STATUS.CANCELLED },
    });

    if (userUsageCount >= coupon.usage_limit_per_user) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        'You have already reached the maximum usage limit for this coupon'
      );
    }
  }

  // calculate discount amount
  let calculatedDiscount = 0;
  if (coupon.discount_type === 'PERCENTAGE') {
    const rawDiscount = (subtotal * coupon.discount_value) / 100;
    const cappedDiscount =
      typeof coupon.max_discount_amount === 'number' && coupon.max_discount_amount > 0
        ? Math.min(rawDiscount, coupon.max_discount_amount)
        : rawDiscount;
    calculatedDiscount = Math.min(Math.round(cappedDiscount), subtotal);
  } else {
    // FLAT discount
    calculatedDiscount = Math.min(coupon.discount_value, subtotal);
  }

  return {
    valid: true,
    coupon: {
      id: coupon._id,
      _id: coupon._id,
      code: coupon.code,
      title: coupon.title,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_discount_amount: coupon.max_discount_amount,
      restaurant_id: coupon.restaurant_id,
    },
    discount_amount: calculatedDiscount,
    min_order_amount: coupon.min_order_amount,
    message: `Coupon "${coupon.code}" applied! You saved ৳${calculatedDiscount}.`,
  };
};
