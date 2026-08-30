// restaurant catalog and vendor management business logic
import { Restaurant } from './restaurant.model.js';
import { Category } from '../menu/category.model.js';
import { FoodItem } from '../menu/foodItem.model.js';
import { User } from '../user/user.model.js';
import { Zone } from '../zone/zone.model.js';
import { ApiError } from '../../utils/apiError.js';
import { USER_ROLES } from '../../constants/index.js';

/**
 * get all restaurants (universal catalog discovery across platform)
 * @param {object} queryParams
 * @returns {Array}
 */
export const getAllRestaurants = async ({ search, cuisine, is_open }) => {
  const filter = {};

  if (is_open !== undefined) {
    filter.is_open = is_open === 'true' || is_open === true;
  }

  if (cuisine) {
    filter.cuisine_types = { $in: [new RegExp(cuisine, 'i')] };
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { cuisine_types: { $regex: search, $options: 'i' } },
    ];
  }

  const restaurants = await Restaurant.find(filter)
    .populate('zone_id', 'name city fixed_delivery_fee')
    .sort({ is_open: -1, rating_avg: -1, createdAt: -1 });

  return restaurants;
};

/**
 * get detailed restaurant with categorized menu items
 * @param {string} restaurantIdOrSlug
 * @returns {object}
 */
export const getRestaurantDetails = async (restaurantIdOrSlug) => {
  let restaurant;
  if (restaurantIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    restaurant = await Restaurant.findById(restaurantIdOrSlug).populate('zone_id');
  } else {
    restaurant = await Restaurant.findOne({ slug: restaurantIdOrSlug.toLowerCase() }).populate('zone_id');
  }

  if (!restaurant) {
    throw ApiError.notFound('restaurant not found');
  }

  const categories = await Category.find({
    restaurant_id: restaurant._id,
    is_active: true,
  }).sort({ sort_order: 1, name: 1 });

  const foodItems = await FoodItem.find({
    restaurant_id: restaurant._id,
    is_available: true,
  }).sort({ base_price: 1 });

  const menu = categories.map((cat) => {
    const catObj = cat.toJSON();
    catObj.items = foodItems.filter(
      (item) => item.category_id.toString() === cat._id.toString()
    );
    return catObj;
  });

  const restObj = restaurant.toJSON();
  restObj.menu = menu;

  return restObj;
};

/**
 * onboard a new restaurant (admin or vendor)
 * @param {object} payload
 * @returns {object}
 */
export const createRestaurant = async ({
  owner_id,
  zone_id,
  name,
  slug,
  description,
  logo_url,
  cover_image_url,
  address,
  cuisine_types = [],
  commission_rate = 10,
  estimated_delivery_time = '30-45 mins',
}) => {
  const owner = await User.findById(owner_id);
  if (!owner) {
    throw ApiError.badRequest('owner user does not exist');
  }

  const zone = await Zone.findById(zone_id);
  if (!zone) {
    throw ApiError.badRequest('primary zone does not exist');
  }

  const existingSlug = await Restaurant.findOne({ slug: slug.toLowerCase().trim() });
  if (existingSlug) {
    throw ApiError.conflict('a restaurant with this slug already exists');
  }

  const restaurant = await Restaurant.create({
    owner_id,
    zone_id,
    name: name.trim(),
    slug: slug.toLowerCase().trim(),
    description: description ? description.trim() : '',
    logo_url,
    cover_image_url,
    address: address.trim(),
    cuisine_types: Array.isArray(cuisine_types) ? cuisine_types : [],
    commission_rate: Number(commission_rate),
    estimated_delivery_time,
    is_open: true,
  });

  // ensure owner has restaurant owner role
  if (owner.role !== USER_ROLES.RESTAURANT_OWNER) {
    owner.role = USER_ROLES.RESTAURANT_OWNER;
    await owner.save();
  }

  return restaurant;
};

/**
 * toggle restaurant open/closed status (vendor or admin)
 * @param {string} restaurantId
 * @param {boolean} isOpen
 * @param {object} authenticatedUser
 * @returns {object}
 */
export const toggleRestaurantStatus = async (restaurantId, isOpen, authenticatedUser) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw ApiError.notFound('restaurant not found');
  }

  // verify ownership if vendor
  if (
    authenticatedUser.role === USER_ROLES.RESTAURANT_OWNER &&
    restaurant.owner_id.toString() !== authenticatedUser._id.toString()
  ) {
    throw ApiError.forbidden('you can only modify your own restaurant');
  }

  restaurant.is_open = Boolean(isOpen);
  await restaurant.save();

  return restaurant;
};

/**
 * get restaurant profile for authenticated vendor owner
 * @param {string} ownerId
 * @returns {object}
 */
export const getMyRestaurant = async (ownerId) => {
  const restaurant = await Restaurant.findOne({ owner_id: ownerId }).populate('zone_id');
  if (!restaurant) {
    throw ApiError.notFound('no restaurant profile associated with this account');
  }
  return restaurant;
};
