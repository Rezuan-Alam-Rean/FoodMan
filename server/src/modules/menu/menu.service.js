// restaurant menu categories and food item business logic
import { Category } from './category.model.js';
import { FoodItem } from './foodItem.model.js';
import { Restaurant } from '../restaurant/restaurant.model.js';
import { ApiError } from '../../utils/apiError.js';
import { USER_ROLES } from '../../constants/index.js';

/**
 * verify if authenticated user owns the restaurant or is admin
 * @param {string} restaurantId
 * @param {object} user
 */
const verifyRestaurantAccess = async (restaurantId, user) => {
  if (user.role === USER_ROLES.ADMIN) return;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw ApiError.notFound('restaurant not found');
  }

  if (restaurant.owner_id.toString() !== user._id.toString()) {
    throw ApiError.forbidden('you do not have permission to manage this menu');
  }
};

/**
 * create a new menu category
 * @param {string} restaurantId
 * @param {object} payload
 * @param {object} user
 * @returns {object}
 */
export const createMenuCategory = async (restaurantId, { name, sort_order = 0 }, user) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('category name is required');
  }

  await verifyRestaurantAccess(restaurantId, user);

  const existing = await Category.findOne({
    restaurant_id: restaurantId,
    name: name.trim(),
  });
  if (existing) {
    throw ApiError.conflict('a category with this name already exists in this restaurant');
  }

  const category = await Category.create({
    restaurant_id: restaurantId,
    name: name.trim(),
    sort_order: Number(sort_order) || 0,
    is_active: true,
  });

  return category;
};

/**
 * update a menu category
 * @param {string} categoryId
 * @param {object} updates
 * @param {object} user
 * @returns {object}
 */
export const updateMenuCategory = async (categoryId, updates = {}, user) => {
  const category = await Category.findById(categoryId);
  if (!category) {
    throw ApiError.notFound('category not found');
  }

  await verifyRestaurantAccess(category.restaurant_id, user);

  if (updates.name !== undefined) {
    if (!updates.name || typeof updates.name !== 'string' || !updates.name.trim()) {
      throw ApiError.badRequest('category name cannot be empty');
    }
    if (updates.name.trim() !== category.name) {
      const existing = await Category.findOne({
        restaurant_id: category.restaurant_id,
        name: updates.name.trim(),
      });
      if (existing && existing._id.toString() !== categoryId) {
        throw ApiError.conflict('a category with this name already exists');
      }
      category.name = updates.name.trim();
    }
  }

  if (updates.sort_order !== undefined) category.sort_order = Number(updates.sort_order) || 0;
  if (updates.is_active !== undefined) category.is_active = Boolean(updates.is_active);

  await category.save();
  return category;
};

/**
 * create a new food item with variants and add-ons
 * @param {string} restaurantId
 * @param {object} payload
 * @param {object} user
 * @returns {object}
 */
export const createFoodItem = async (
  restaurantId,
  {
    category_id,
    name,
    description = '',
    image_url = null,
    base_price,
    variants = [],
    add_ons = [],
    is_vegetarian = false,
  },
  user
) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('food item name is required');
  }

  const price = Number(base_price);
  if (!Number.isFinite(price) || price < 0) {
    throw ApiError.badRequest('base_price must be a non-negative number');
  }

  await verifyRestaurantAccess(restaurantId, user);

  const category = await Category.findOne({ _id: category_id, restaurant_id: restaurantId });
  if (!category) {
    throw ApiError.badRequest('specified category does not belong to this restaurant');
  }

  const foodItem = await FoodItem.create({
    restaurant_id: restaurantId,
    category_id,
    name: name.trim(),
    description: description && typeof description === 'string' ? description.trim() : '',
    image_url,
    base_price: price,
    variants: Array.isArray(variants) ? variants : [],
    add_ons: Array.isArray(add_ons) ? add_ons : [],
    is_vegetarian: Boolean(is_vegetarian),
    is_available: true,
  });

  return foodItem;
};

/**
 * update food item details and availability
 * @param {string} foodItemId
 * @param {object} updates
 * @param {object} user
 * @returns {object}
 */
export const updateFoodItem = async (foodItemId, updates = {}, user) => {
  const foodItem = await FoodItem.findById(foodItemId);
  if (!foodItem) {
    throw ApiError.notFound('food item not found');
  }

  await verifyRestaurantAccess(foodItem.restaurant_id, user);

  if (updates.name !== undefined) {
    if (!updates.name || typeof updates.name !== 'string' || !updates.name.trim()) {
      throw ApiError.badRequest('food item name cannot be empty');
    }
    foodItem.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    foodItem.description = updates.description && typeof updates.description === 'string' ? updates.description.trim() : '';
  }

  if (updates.image_url !== undefined) foodItem.image_url = updates.image_url;

  if (updates.base_price !== undefined) {
    const price = Number(updates.base_price);
    if (!Number.isFinite(price) || price < 0) {
      throw ApiError.badRequest('base_price must be a non-negative number');
    }
    foodItem.base_price = price;
  }

  if (updates.variants !== undefined) foodItem.variants = Array.isArray(updates.variants) ? updates.variants : [];
  if (updates.add_ons !== undefined) foodItem.add_ons = Array.isArray(updates.add_ons) ? updates.add_ons : [];
  if (updates.is_vegetarian !== undefined) foodItem.is_vegetarian = Boolean(updates.is_vegetarian);
  if (updates.is_available !== undefined) foodItem.is_available = Boolean(updates.is_available);

  await foodItem.save();
  return foodItem;
};

/**
 * delete food item
 * @param {string} foodItemId
 * @param {object} user
 */
export const deleteFoodItem = async (foodItemId, user) => {
  const foodItem = await FoodItem.findById(foodItemId);
  if (!foodItem) {
    throw ApiError.notFound('food item not found');
  }

  await verifyRestaurantAccess(foodItem.restaurant_id, user);
  await FoodItem.findByIdAndDelete(foodItemId);
  return true;
};
