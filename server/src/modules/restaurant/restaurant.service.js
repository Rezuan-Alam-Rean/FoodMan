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
 * @returns {Array|object}
 */
export const getAllRestaurants = async ({ search, is_open, page, limit } = {}) => {
  const filter = {};

  if (is_open !== undefined) {
    filter.is_open = is_open === 'true' || is_open === true;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
      { address: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  if (page !== undefined || limit !== undefined) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
    const skip = (p - 1) * l;

    const total = await Restaurant.countDocuments(filter);
    const totalPages = Math.ceil(total / l) || 1;

    const restaurants = await Restaurant.find(filter)
      .populate('zone_id', 'name city fixed_delivery_fee')
      .sort({ is_open: -1, rating_avg: -1, createdAt: -1 })
      .skip(skip)
      .limit(l);

    return {
      restaurants,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages,
        hasNextPage: p < totalPages,
        hasPrevPage: p > 1,
      },
    };
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

  const foodItems = await FoodItem.find({
    restaurant_id: restaurant._id,
    is_available: true,
  })
    .populate('category_id')
    .sort({ name: 1 });

  // dynamically group food items under their respective active global categories
  const categoryMap = new Map();

  for (const item of foodItems) {
    const category = item.category_id;
    if (!category || category.is_active === false) continue;

    const catId = category._id ? category._id.toString() : String(category);
    if (!categoryMap.has(catId)) {
      categoryMap.set(catId, {
        _id: category._id || category,
        id: category._id || category,
        name: category.name || 'Uncategorized',
        emoji: category.emoji || '🍽️',
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
        items: [],
      });
    }

    categoryMap.get(catId).items.push(item);
  }

  const menu = Array.from(categoryMap.values()).sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  );

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
  commission_rate = 10,
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
    commission_rate: commRate,
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

/**
 * update restaurant details (name, address, zone_id, description)
 * @param {string} restaurantId
 * @param {object} updates
 * @param {object} user
 * @returns {object}
 */
export const updateRestaurantProfile = async (restaurantId, updates, user) => {
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

  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || !updates.name.trim()) {
      throw ApiError.badRequest('restaurant name cannot be empty');
    }
    restaurant.name = updates.name.trim();
  }

  if (updates.address !== undefined) {
    if (typeof updates.address !== 'string' || !updates.address.trim()) {
      throw ApiError.badRequest('restaurant address cannot be empty');
    }
    restaurant.address = updates.address.trim();
  }

  if (updates.zone_id !== undefined) {
    const zone = await Zone.findById(updates.zone_id);
    if (!zone) {
      throw ApiError.badRequest('selected primary zone does not exist');
    }
    restaurant.zone_id = updates.zone_id;
  }

  if (updates.description !== undefined) {
    restaurant.description = typeof updates.description === 'string' ? updates.description.trim() : '';
  }

  if (updates.logo_url !== undefined) {
    restaurant.logo_url = updates.logo_url && typeof updates.logo_url === 'string' ? updates.logo_url.trim() : null;
  }

  if (updates.cover_image_url !== undefined) {
    restaurant.cover_image_url = updates.cover_image_url && typeof updates.cover_image_url === 'string' ? updates.cover_image_url.trim() : null;
  }

  await restaurant.save();
  await restaurant.populate('zone_id', 'name city fixed_delivery_fee');

  return restaurant;
};

