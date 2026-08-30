// restaurant catalog and vendor management business logic
import { Restaurant } from './restaurant.model.js';
import { Category } from '../menu/category.model.js';
import { FoodItem } from '../menu/foodItem.model.js';
import { User } from '../user/user.model.js';
import { Zone } from '../zone/zone.model.js';
import { ApiError } from '../../utils/apiError.js';
import { USER_ROLES } from '../../constants/index.js';

// helper to safely escape regex special characters
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * get all restaurants (universal catalog discovery across platform)
 * @param {object} queryParams
 * @returns {Array}
 */
export const getAllRestaurants = async ({ search, cuisine, is_open } = {}) => {
  const filter = {};

  if (is_open !== undefined) {
    filter.is_open = is_open === 'true' || is_open === true;
  }

  if (cuisine && typeof cuisine === 'string' && cuisine.trim()) {
    const safeCuisine = escapeRegex(cuisine.trim());
    filter.cuisine_types = { $in: [new RegExp(safeCuisine, 'i')] };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { cuisine_types: { $regex: safeSearch, $options: 'i' } },
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
  if (!restaurantIdOrSlug || typeof restaurantIdOrSlug !== 'string') {
    throw ApiError.badRequest('valid restaurant id or slug is required');
  }

  let restaurant;
  if (restaurantIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    restaurant = await Restaurant.findById(restaurantIdOrSlug).populate('zone_id');
  } else {
    restaurant = await Restaurant.findOne({ slug: restaurantIdOrSlug.toLowerCase().trim() }).populate('zone_id');
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
  }).sort({ name: 1 });

  // map items under their respective categories
  const menu = categories.map((category) => {
    const catObj = category.toJSON();
    catObj.items = foodItems.filter(
      (item) => item.category_id.toString() === category._id.toString()
    );
    return catObj;
  });

  return {
    restaurant,
    menu,
  };
};

/**
 * create/onboard a new restaurant (admin or vendor)
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
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('restaurant name is required');
  }

  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    throw ApiError.badRequest('restaurant slug is required');
  }

  if (!address || typeof address !== 'string' || !address.trim()) {
    throw ApiError.badRequest('restaurant address is required');
  }

  const owner = await User.findById(owner_id);
  if (!owner) {
    throw ApiError.badRequest('owner user does not exist');
  }

  const zone = await Zone.findById(zone_id);
  if (!zone) {
    throw ApiError.badRequest('primary zone does not exist');
  }

  const cleanSlug = slug.toLowerCase().trim();
  const existingSlug = await Restaurant.findOne({ slug: cleanSlug });
  if (existingSlug) {
    throw ApiError.conflict('a restaurant with this slug already exists');
  }

  const commRate = Number(commission_rate);
  if (!Number.isFinite(commRate) || commRate < 0 || commRate > 100) {
    throw ApiError.badRequest('commission_rate must be a valid percentage between 0 and 100');
  }

  const restaurant = await Restaurant.create({
    owner_id,
    zone_id,
    name: name.trim(),
    slug: cleanSlug,
    description: description && typeof description === 'string' ? description.trim() : '',
    logo_url,
    cover_image_url,
    address: address.trim(),
    cuisine_types: Array.isArray(cuisine_types) ? cuisine_types : [],
    commission_rate: commRate,
    estimated_delivery_time: estimated_delivery_time || '30-45 mins',
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
 * @param {object} user
 * @returns {object}
 */
export const toggleRestaurantStatus = async (restaurantId, isOpen, user) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw ApiError.notFound('restaurant not found');
  }

  // verify ownership or admin role
  if (
    user.role !== USER_ROLES.ADMIN &&
    restaurant.owner_id.toString() !== user._id.toString()
  ) {
    throw ApiError.forbidden('you do not have permission to manage this restaurant');
  }

  if (typeof isOpen !== 'boolean') {
    throw ApiError.badRequest('is_open must be a boolean (true or false)');
  }

  restaurant.is_open = isOpen;
  await restaurant.save();

  return restaurant;
};

/**
 * get restaurant managed by authenticated owner
 * @param {string} ownerId
 * @returns {object}
 */
export const getMyRestaurant = async (ownerId) => {
  const restaurant = await Restaurant.findOne({ owner_id: ownerId }).populate('zone_id');
  if (!restaurant) {
    throw ApiError.notFound('no restaurant found for this owner account');
  }
  return restaurant;
};
