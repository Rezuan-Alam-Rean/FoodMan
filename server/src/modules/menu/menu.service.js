// global catalog categories and restaurant food item business logic
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
 * get all global categories
 * @param {object} queryParams
 * @returns {Array}
 */
export const getAllCategories = async ({ is_active } = {}) => {
  const filter = {};
  if (is_active !== undefined) {
    filter.is_active = is_active === 'true' || is_active === true;
  }

  const categories = await Category.find(filter).sort({ sort_order: 1, name: 1 });
  return categories;
};

/**
 * create a new global menu category (strictly ADMIN only)
 * @param {object} payload
 * @param {object} user
 * @returns {object}
 */
export const createCategory = async (
  { name, emoji = '🍽️', sort_order = 0, is_active = true },
  user
) => {
  if (!user || user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden('only administrators can create categories');
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('category name is required');
  }

  const cleanName = name.trim();
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  if (existing) {
    throw ApiError.conflict('a category with this name already exists');
  }

  const category = await Category.create({
    name: cleanName,
    emoji: emoji && typeof emoji === 'string' ? emoji.trim() : '🍽️',
    sort_order: Number(sort_order) || 0,
    is_active: is_active === undefined ? true : is_active === 'true' || is_active === true,
  });

  return category;
};

/**
 * update a global menu category (strictly ADMIN only)
 * @param {string} categoryId
 * @param {object} updates
 * @param {object} user
 * @returns {object}
 */
export const updateCategory = async (categoryId, updates = {}, user) => {
  if (!user || user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden('only administrators can update categories');
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw ApiError.notFound('category not found');
  }

  if (updates.name !== undefined) {
    if (!updates.name || typeof updates.name !== 'string' || !updates.name.trim()) {
      throw ApiError.badRequest('category name cannot be empty');
    }
    const cleanName = updates.name.trim();
    if (cleanName.toLowerCase() !== category.name.toLowerCase()) {
      const existing = await Category.findOne({
        name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (existing && existing._id.toString() !== categoryId) {
        throw ApiError.conflict('a category with this name already exists');
      }
      category.name = cleanName;
    }
  }

  if (updates.emoji !== undefined) {
    category.emoji = updates.emoji && typeof updates.emoji === 'string' ? updates.emoji.trim() : '🍽️';
  }
  if (updates.sort_order !== undefined) category.sort_order = Number(updates.sort_order) || 0;
  if (updates.is_active !== undefined) {
    category.is_active = updates.is_active === 'true' || updates.is_active === true;
  }

  await category.save();
  return category;
};

/**
 * delete a global category (strictly ADMIN only)
 * @param {string} categoryId
 * @param {object} user
 * @returns {boolean}
 */
export const deleteCategory = async (categoryId, user) => {
  if (!user || user.role !== USER_ROLES.ADMIN) {
    throw ApiError.forbidden('only administrators can delete categories');
  }

  const category = await Category.findById(categoryId);
  if (!category) {
    throw ApiError.notFound('category not found');
  }

  const attachedItemsCount = await FoodItem.countDocuments({ category_id: categoryId });
  if (attachedItemsCount > 0) {
    throw ApiError.badRequest(
      `cannot delete category '${category.name}' because ${attachedItemsCount} food item(s) are currently attached to it`
    );
  }

  await Category.findByIdAndDelete(categoryId);
  return true;
};

/**
 * validates and sanitizes a discount price against its regular price
 * @param {number|null|undefined|string} discountPrice
 * @param {number} regularPrice
 * @param {string} label
 * @returns {number|null}
 */
const sanitizeDiscountPrice = (discountPrice, regularPrice, label = 'discount price') => {
  if (discountPrice === null || discountPrice === undefined || discountPrice === '') {
    return null;
  }
  const parsed = Number(discountPrice);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw ApiError.badRequest(`${label} must be a non-negative number`);
  }
  if (parsed >= regularPrice) {
    throw ApiError.badRequest(`${label} must be strictly less than the regular price (${regularPrice})`);
  }
  return parsed;
};

/**
 * sanitizes variants and validates variant options pricing and discounts
 * @param {Array} variants
 * @returns {Array}
 */
const sanitizeVariants = (variants) => {
  if (!Array.isArray(variants)) return [];
  return variants.map((group) => {
    const options = Array.isArray(group.options)
      ? group.options.map((opt) => {
          const optPrice = Number(opt.price);
          if (!Number.isFinite(optPrice) || optPrice < 0) {
            throw ApiError.badRequest(`variant option '${opt.name || 'unnamed'}' must have a valid non-negative price`);
          }
          const optDiscount = sanitizeDiscountPrice(
            opt.discount_price,
            optPrice,
            `variant option '${opt.name || 'unnamed'}' discount price`
          );
          return {
            ...opt,
            price: optPrice,
            discount_price: optDiscount,
          };
        })
      : [];
    return {
      ...group,
      options,
    };
  });
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
    discount_price = null,
    variants = [],
    add_ons = [],
    is_vegetarian = false,
  },
  user
) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('food item name is required');
  }

  if (!category_id) {
    throw ApiError.badRequest('category_id is required');
  }

  const price = Number(base_price);
  if (!Number.isFinite(price) || price < 0) {
    throw ApiError.badRequest('base_price must be a non-negative number');
  }

  const sanitizedDiscount = sanitizeDiscountPrice(discount_price, price, 'discount price');
  const sanitizedVariantList = sanitizeVariants(variants);

  await verifyRestaurantAccess(restaurantId, user);

  const category = await Category.findById(category_id);
  if (!category) {
    throw ApiError.badRequest('specified category does not exist');
  }

  const foodItem = await FoodItem.create({
    restaurant_id: restaurantId,
    category_id,
    name: name.trim(),
    description: description && typeof description === 'string' ? description.trim() : '',
    image_url,
    base_price: price,
    discount_price: sanitizedDiscount,
    variants: sanitizedVariantList,
    add_ons: Array.isArray(add_ons) ? add_ons : [],
    is_vegetarian: is_vegetarian === 'true' || is_vegetarian === true,
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

  if (updates.category_id !== undefined) {
    const category = await Category.findById(updates.category_id);
    if (!category) {
      throw ApiError.badRequest('specified category does not exist');
    }
    foodItem.category_id = updates.category_id;
  }

  if (updates.name !== undefined) {
    if (!updates.name || typeof updates.name !== 'string' || !updates.name.trim()) {
      throw ApiError.badRequest('food item name cannot be empty');
    }
    foodItem.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    foodItem.description = updates.description && typeof updates.description === 'string' ? updates.description.trim() : '';
  }

  if (updates.image_url !== undefined) {
    foodItem.image_url =
      updates.image_url && typeof updates.image_url === 'string' ? updates.image_url.trim() : null;
  }

  let effectiveBasePrice = foodItem.base_price;
  if (updates.base_price !== undefined) {
    const price = Number(updates.base_price);
    if (!Number.isFinite(price) || price < 0) {
      throw ApiError.badRequest('base_price must be a non-negative number');
    }
    effectiveBasePrice = price;
    foodItem.base_price = price;
  }

  if (updates.discount_price !== undefined) {
    foodItem.discount_price = sanitizeDiscountPrice(updates.discount_price, effectiveBasePrice, 'discount price');
  } else if (updates.base_price !== undefined && foodItem.discount_price !== null) {
    // If base price changed and existing discount price is now >= base price, throw error
    if (foodItem.discount_price >= effectiveBasePrice) {
      throw ApiError.badRequest(`base_price (${effectiveBasePrice}) cannot be less than or equal to current discount_price (${foodItem.discount_price})`);
    }
  }

  if (updates.variants !== undefined) {
    foodItem.variants = sanitizeVariants(updates.variants);
  }
  if (updates.add_ons !== undefined) foodItem.add_ons = Array.isArray(updates.add_ons) ? updates.add_ons : [];
  if (updates.is_vegetarian !== undefined) {
    foodItem.is_vegetarian = updates.is_vegetarian === 'true' || updates.is_vegetarian === true;
  }
  if (updates.is_available !== undefined) {
    foodItem.is_available = updates.is_available === 'true' || updates.is_available === true;
  }

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

/**
 * get food items with category filtering, search, and pagination
 * @param {object} queryParams
 * @returns {object}
 */
export const getAllFoodItems = async ({
  category_id,
  search,
  is_available,
  is_open = true,
  restaurant_id,
  sort_by,
  sortBy,
  min_price,
  max_price,
  is_vegetarian,
  page = 1,
  limit = 10,
} = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const skip = (p - 1) * l;

  const filter = {};
  if (is_available !== undefined && is_available !== 'all') {
    filter.is_available = is_available === 'true' || is_available === true;
  }

  if (is_vegetarian !== undefined && is_vegetarian !== 'all' && is_vegetarian !== '') {
    filter.is_vegetarian = is_vegetarian === 'true' || is_vegetarian === true;
  }

  if (min_price !== undefined && min_price !== '' && !isNaN(Number(min_price))) {
    filter.base_price = { ...filter.base_price, $gte: Number(min_price) };
  }

  if (max_price !== undefined && max_price !== '' && !isNaN(Number(max_price))) {
    filter.base_price = { ...filter.base_price, $lte: Number(max_price) };
  }

  // restrict to only open restaurants if is_open is true
  if (is_open !== undefined && is_open !== 'all') {
    const shouldBeOpen = is_open === 'true' || is_open === true;
    const matchingRestaurants = await Restaurant.find({ is_open: shouldBeOpen }).select('_id');
    const matchingRestIds = matchingRestaurants.map((r) => r._id);

    if (restaurant_id) {
      if (matchingRestIds.some((id) => id.toString() === restaurant_id.toString())) {
        filter.restaurant_id = restaurant_id;
      } else {
        return {
          items: [],
          pagination: {
            total: 0,
            page: p,
            limit: l,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
    } else {
      filter.restaurant_id = { $in: matchingRestIds };
    }
  } else if (restaurant_id) {
    filter.restaurant_id = restaurant_id;
  }

  // filter by active categories
  const activeCategories = await Category.find({ is_active: true }).select('_id');
  const activeCategoryIds = activeCategories.map((c) => c._id);

  if (category_id && category_id !== 'all') {
    if (activeCategoryIds.some((id) => id.toString() === category_id.toString())) {
      filter.category_id = category_id;
    } else {
      return {
        items: [],
        pagination: {
          total: 0,
          page: p,
          limit: l,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  } else {
    filter.category_id = { $in: activeCategoryIds };
  }

  if (search && typeof search === 'string' && search.trim()) {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  // Determine sort order
  const sortParam = sort_by || sortBy || 'newest';
  let sortOption = { createdAt: -1 };

  if (sortParam === 'price_asc' || sortParam === 'price-asc') {
    sortOption = { base_price: 1, createdAt: -1 };
  } else if (sortParam === 'price_desc' || sortParam === 'price-desc') {
    sortOption = { base_price: -1, createdAt: -1 };
  } else if (sortParam === 'name_asc' || sortParam === 'name') {
    sortOption = { name: 1 };
  } else if (sortParam === 'newest') {
    sortOption = { createdAt: -1 };
  }

  const total = await FoodItem.countDocuments(filter);
  const totalPages = Math.ceil(total / l) || 1;

  const items = await FoodItem.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(l)
    .populate({
      path: 'restaurant_id',
      select: 'name slug address logo_url cover_image_url is_open rating_avg zone_id',
      populate: { path: 'zone_id', select: 'name city fixed_delivery_fee' },
    })
    .populate('category_id', 'name emoji');

  return {
    items,
    pagination: {
      total,
      page: p,
      limit: l,
      totalPages,
      hasNextPage: p < totalPages,
      hasPrevPage: p > 1,
    },
  };
};

