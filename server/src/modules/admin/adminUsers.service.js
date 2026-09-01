import bcrypt from 'bcryptjs';
import { User } from '../user/user.model.js';
import { Rider } from '../rider/rider.model.js';
import { Restaurant } from '../restaurant/restaurant.model.js';
import { Zone } from '../zone/zone.model.js';
import { Order } from '../order/order.model.js';
import { Wallet } from '../wallet/wallet.model.js';
import { UserAddress } from '../address/address.model.js';
import { RiderRemittance } from '../remittance/riderRemittance.model.js';
import { normalizePhoneNumber } from '../../utils/phone.js';
import { ApiError } from '../../utils/apiError.js';
import { USER_ROLES, ORDER_STATUS } from '../../constants/index.js';

// helper to safely escape regex special characters
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * get paginated user list with role-specific stats (customers, riders, restaurants)
 * @param {object} queryParams
 * @returns {object}
 */
export const getAdminUsersList = async ({ role, search, page = 1, limit = 15 } = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
  const skip = (p - 1) * l;

  const userFilter = {};

  if (role && Object.values(USER_ROLES).includes(role)) {
    userFilter.role = role;
  }

  if (search && typeof search === 'string' && search.trim()) {
    const safeSearch = escapeRegex(search.trim());
    userFilter.$or = [
      { name: { $regex: safeSearch, $options: 'i' } },
      { phone_number: { $regex: safeSearch, $options: 'i' } },
      { email: { $regex: safeSearch, $options: 'i' } },
    ];
  }

  const [total, users] = await Promise.all([
    User.countDocuments(userFilter),
    User.find(userFilter)
      .select('-password_hash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l),
  ]);

  const userIds = users.map((u) => u._id);

  // gather role-specific auxiliary stats
  const [customerOrders, riders, restaurants, wallets] = await Promise.all([
    Order.aggregate([
      { $match: { customer_id: { $in: userIds } } },
      {
        $group: {
          _id: '$customer_id',
          total_orders: { $sum: 1 },
          total_spent: {
            $sum: {
              $cond: [{ $eq: ['$status', ORDER_STATUS.DELIVERED] }, '$grand_total', 0],
            },
          },
          last_order_at: { $max: '$createdAt' },
        },
      },
    ]),
    Rider.find({ user_id: { $in: userIds } }).populate('assigned_zones', 'name city'),
    Restaurant.find({ owner_id: { $in: userIds } }).populate('zone_id', 'name city'),
    Wallet.find({ user_id: { $in: userIds } }),
  ]);

  const customerStatsMap = new Map(customerOrders.map((s) => [s._id.toString(), s]));
  const riderMap = new Map(riders.map((r) => [r.user_id.toString(), r]));
  const restaurantMap = new Map(restaurants.map((r) => [r.owner_id.toString(), r]));
  const walletMap = new Map(wallets.map((w) => [w.user_id.toString(), w]));

  // rider completed orders count aggregation
  const riderIds = riders.map((r) => r._id);
  const riderDeliveries = await Order.aggregate([
    { $match: { rider_id: { $in: riderIds }, status: ORDER_STATUS.DELIVERED } },
    {
      $group: {
        _id: '$rider_id',
        completed_deliveries: { $sum: 1 },
        total_delivery_fees: { $sum: '$delivery_fee' },
      },
    },
  ]);
  const riderStatsMap = new Map(riderDeliveries.map((s) => [s._id.toString(), s]));

  // restaurant fulfilled orders and gross sales aggregation
  const restaurantIds = restaurants.map((r) => r._id);
  const restaurantSales = await Order.aggregate([
    { $match: { restaurant_id: { $in: restaurantIds }, status: ORDER_STATUS.DELIVERED } },
    {
      $group: {
        _id: '$restaurant_id',
        fulfilled_orders: { $sum: 1 },
        gross_sales: { $sum: '$food_subtotal' },
      },
    },
  ]);
  const restaurantStatsMap = new Map(restaurantSales.map((s) => [s._id.toString(), s]));

  const enrichedUsers = users.map((user) => {
    const uObj = user.toObject();
    const uId = user._id.toString();
    const wallet = walletMap.get(uId);

    if (user.role === USER_ROLES.CUSTOMER) {
      const cStats = customerStatsMap.get(uId);
      return {
        ...uObj,
        customer_stats: {
          total_orders: cStats?.total_orders || 0,
          total_spent: cStats?.total_spent || 0,
          last_order_at: cStats?.last_order_at || null,
        },
      };
    }

    if (user.role === USER_ROLES.RIDER) {
      const rider = riderMap.get(uId);
      const rStats = rider ? riderStatsMap.get(rider._id.toString()) : null;
      return {
        ...uObj,
        rider_profile: rider || null,
        rider_stats: {
          completed_deliveries: rStats?.completed_deliveries || 0,
          total_earned: rStats?.total_delivery_fees || 0,
          current_balance: wallet?.current_balance || 0,
          lifetime_earnings: wallet?.lifetime_earnings || 0,
          total_settled: wallet?.total_settled_by_admin || 0,
        },
      };
    }

    if (user.role === USER_ROLES.RESTAURANT_OWNER) {
      const restaurant = restaurantMap.get(uId);
      const restStats = restaurant ? restaurantStatsMap.get(restaurant._id.toString()) : null;
      const commRate = restaurant?.commission_rate ?? 10;
      const grossSales = restStats?.gross_sales || 0;
      const commissionAmount = Math.round((grossSales * commRate) / 100);

      return {
        ...uObj,
        restaurant_profile: restaurant || null,
        restaurant_stats: {
          fulfilled_orders: restStats?.fulfilled_orders || 0,
          gross_sales: grossSales,
          commission_paid: commissionAmount,
          current_balance: wallet?.current_balance || 0,
          lifetime_earnings: wallet?.lifetime_earnings || 0,
          total_settled: wallet?.total_settled_by_admin || 0,
        },
      };
    }

    return uObj;
  });

  return {
    users: enrichedUsers,
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
 * get customer deep-dive details, addresses, and order history
 * @param {string} customerId
 * @param {object} queryParams
 * @returns {object}
 */
export const getAdminCustomerDetails = async (customerId, { page = 1, limit = 10 } = {}) => {
  const customer = await User.findById(customerId).select('-password_hash');
  if (!customer) {
    throw ApiError.notFound('customer account not found');
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const skip = (p - 1) * l;

  const [addresses, totalOrders, orders, spendAggregate] = await Promise.all([
    UserAddress.find({ user_id: customer._id }).populate('zone_id subzone_id'),
    Order.countDocuments({ customer_id: customer._id }),
    Order.find({ customer_id: customer._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('restaurant_id', 'name slug address phone_number logo_url')
      .populate('delivery_zone_id', 'name fixed_delivery_fee')
      .populate('delivery_subzone_id', 'name custom_fixed_fee')
      .populate({
        path: 'rider_id',
        populate: { path: 'user_id', select: 'name phone_number' },
      }),
    Order.aggregate([
      { $match: { customer_id: customer._id, status: ORDER_STATUS.DELIVERED } },
      {
        $group: {
          _id: null,
          total_spent: { $sum: '$grand_total' },
          total_food_subtotal: { $sum: '$food_subtotal' },
          total_delivery_fees: { $sum: '$delivery_fee' },
        },
      },
    ]),
  ]);

  return {
    customer,
    addresses,
    stats: {
      total_orders: totalOrders,
      total_spent: spendAggregate[0]?.total_spent || 0,
      total_food_subtotal: spendAggregate[0]?.total_food_subtotal || 0,
      total_delivery_fees: spendAggregate[0]?.total_delivery_fees || 0,
    },
    orders,
    pagination: {
      total: totalOrders,
      page: p,
      limit: l,
      totalPages: Math.ceil(totalOrders / l) || 1,
      hasNextPage: p * l < totalOrders,
      hasPrevPage: p > 1,
    },
  };
};

/**
 * get rider deep-dive details, delivery history, wallet, and remittances
 * @param {string} riderIdOrUserId
 * @param {object} queryParams
 * @returns {object}
 */
export const getAdminRiderDetails = async (riderIdOrUserId, { page = 1, limit = 10 } = {}) => {
  let rider;
  if (String(riderIdOrUserId).match(/^[0-9a-fA-F]{24}$/)) {
    rider = await Rider.findById(riderIdOrUserId)
      .populate('user_id', '-password_hash')
      .populate('assigned_zones');
    if (!rider) {
      rider = await Rider.findOne({ user_id: riderIdOrUserId })
        .populate('user_id', '-password_hash')
        .populate('assigned_zones');
    }
  }

  if (!rider) {
    throw ApiError.notFound('rider profile not found');
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const skip = (p - 1) * l;

  const [wallet, totalDeliveries, deliveries, remittances, statsAggregate] = await Promise.all([
    Wallet.findOne({ user_id: rider.user_id._id }),
    Order.countDocuments({ rider_id: rider._id }),
    Order.find({ rider_id: rider._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('restaurant_id', 'name slug address phone_number')
      .populate('delivery_zone_id', 'name fixed_delivery_fee')
      .populate('delivery_subzone_id', 'name custom_fixed_fee'),
    RiderRemittance.find({ rider_id: rider._id }).sort({ createdAt: -1 }).limit(20),
    Order.aggregate([
      { $match: { rider_id: rider._id, status: ORDER_STATUS.DELIVERED } },
      {
        $group: {
          _id: null,
          delivered_count: { $sum: 1 },
          total_delivery_fees: { $sum: '$delivery_fee' },
          total_cod_collected: { $sum: '$grand_total' },
        },
      },
    ]),
  ]);

  return {
    rider,
    wallet: wallet || {
      current_balance: 0,
      lifetime_earnings: 0,
      total_settled_by_admin: 0,
    },
    stats: {
      total_orders_handled: totalDeliveries,
      completed_deliveries: statsAggregate[0]?.delivered_count || 0,
      total_delivery_fees_earned: statsAggregate[0]?.total_delivery_fees || 0,
      total_cod_collected: statsAggregate[0]?.total_cod_collected || 0,
    },
    deliveries,
    remittances,
    pagination: {
      total: totalDeliveries,
      page: p,
      limit: l,
      totalPages: Math.ceil(totalDeliveries / l) || 1,
      hasNextPage: p * l < totalDeliveries,
      hasPrevPage: p > 1,
    },
  };
};

/**
 * get restaurant deep-dive details, fulfilled order history, and wallet
 * @param {string} restaurantIdOrUserId
 * @param {object} queryParams
 * @returns {object}
 */
export const getAdminRestaurantDetails = async (
  restaurantIdOrUserId,
  { page = 1, limit = 10 } = {}
) => {
  let restaurant;
  if (String(restaurantIdOrUserId).match(/^[0-9a-fA-F]{24}$/)) {
    restaurant = await Restaurant.findById(restaurantIdOrUserId)
      .populate('owner_id', '-password_hash')
      .populate('zone_id');
    if (!restaurant) {
      restaurant = await Restaurant.findOne({ owner_id: restaurantIdOrUserId })
        .populate('owner_id', '-password_hash')
        .populate('zone_id');
    }
  }

  if (!restaurant) {
    throw ApiError.notFound('restaurant outlet not found');
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const skip = (p - 1) * l;

  const [wallet, totalOrders, orders, salesAggregate] = await Promise.all([
    Wallet.findOne({ user_id: restaurant.owner_id._id }),
    Order.countDocuments({ restaurant_id: restaurant._id }),
    Order.find({ restaurant_id: restaurant._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .populate('delivery_zone_id', 'name')
      .populate('delivery_subzone_id', 'name')
      .populate({
        path: 'rider_id',
        populate: { path: 'user_id', select: 'name phone_number' },
      }),
    Order.aggregate([
      { $match: { restaurant_id: restaurant._id, status: ORDER_STATUS.DELIVERED } },
      {
        $group: {
          _id: null,
          fulfilled_count: { $sum: 1 },
          gross_food_sales: { $sum: '$food_subtotal' },
        },
      },
    ]),
  ]);

  const grossSales = salesAggregate[0]?.gross_food_sales || 0;
  const commRate = restaurant.commission_rate ?? 10;
  const commissionDeducted = Math.round((grossSales * commRate) / 100);
  const netEarnings = grossSales - commissionDeducted;

  return {
    restaurant,
    wallet: wallet || {
      current_balance: 0,
      lifetime_earnings: 0,
      total_settled_by_admin: 0,
    },
    stats: {
      total_orders_received: totalOrders,
      fulfilled_orders: salesAggregate[0]?.fulfilled_count || 0,
      gross_food_sales: grossSales,
      commission_rate: commRate,
      commission_deducted: commissionDeducted,
      net_food_earnings: netEarnings,
    },
    orders,
    pagination: {
      total: totalOrders,
      page: p,
      limit: l,
      totalPages: Math.ceil(totalOrders / l) || 1,
      hasNextPage: p * l < totalOrders,
      hasPrevPage: p > 1,
    },
  };
};

/**
 * get unified user deep-dive details automatically resolving role
 * @param {string} userId
 * @param {object} queryParams
 * @returns {object}
 */
export const getAdminUserDetails = async (userId, queryParams = {}) => {
  if (!String(userId).match(/^[0-9a-fA-F]{24}$/)) {
    throw ApiError.badRequest('invalid user id format');
  }

  const user = await User.findById(userId).select('-password_hash');
  if (!user) {
    const rider = await Rider.findById(userId);
    if (rider) {
      return getAdminRiderDetails(rider._id, queryParams);
    }
    const restaurant = await Restaurant.findById(userId);
    if (restaurant) {
      return getAdminRestaurantDetails(restaurant._id, queryParams);
    }
    throw ApiError.notFound('user account not found');
  }

  if (user.role === USER_ROLES.CUSTOMER) {
    return getAdminCustomerDetails(user._id, queryParams);
  }
  if (user.role === USER_ROLES.RIDER) {
    return getAdminRiderDetails(user._id, queryParams);
  }
  if (user.role === USER_ROLES.RESTAURANT_OWNER) {
    return getAdminRestaurantDetails(user._id, queryParams);
  }

  return { user, role: user.role };
};

/**
 * admin creates a new user across any platform role
 * @param {object} payload
 * @returns {object}
 */
export const createAdminUser = async ({
  name,
  phone_number,
  email,
  password,
  role = USER_ROLES.CUSTOMER,
  vehicle_type = 'MOTORCYCLE',
  driving_license_no,
  nid_number,
  assigned_zones = [],
  cash_in_hand_limit = 3000,
  restaurant_name,
  zone_id,
  restaurant_address,
  commission_rate = 10,
  description = '',
}) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw ApiError.badRequest('full name is required');
  }

  const normalizedPhone = normalizePhoneNumber(phone_number);
  if (!normalizedPhone) {
    throw ApiError.badRequest('invalid bangladesh mobile number format (01xxxxxxxxx)');
  }

  const existingPhone = await User.findOne({ phone_number: normalizedPhone });
  if (existingPhone) {
    throw ApiError.conflict('a user with this phone number already exists');
  }

  if (email && typeof email === 'string' && email.trim()) {
    const cleanEmail = email.toLowerCase().trim();
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      throw ApiError.conflict('a user with this email already exists');
    }
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw ApiError.badRequest('password is required and must be at least 6 characters');
  }

  if (!Object.values(USER_ROLES).includes(role)) {
    throw ApiError.badRequest(`invalid role: ${role}`);
  }

  if (role === USER_ROLES.RESTAURANT_OWNER) {
    if (!restaurant_name || typeof restaurant_name !== 'string' || !restaurant_name.trim()) {
      throw ApiError.badRequest('restaurant name is required for restaurant owner account');
    }
    if (!zone_id) {
      throw ApiError.badRequest('primary zone is required for restaurant owner account');
    }
    const zoneExists = await Zone.findById(zone_id);
    if (!zoneExists) {
      throw ApiError.badRequest('specified primary zone does not exist');
    }
    if (!restaurant_address || typeof restaurant_address !== 'string' || !restaurant_address.trim()) {
      throw ApiError.badRequest('physical restaurant address is required');
    }
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const userData = {
    name: name.trim(),
    phone_number: normalizedPhone,
    role,
    password_hash,
    status: 'ACTIVE',
  };

  if (email && typeof email === 'string' && email.trim()) {
    userData.email = email.toLowerCase().trim();
  }

  const user = await User.create(userData);

  let riderProfile = null;
  let restaurantProfile = null;
  let wallet = null;

  if (role === USER_ROLES.RIDER) {
    riderProfile = await Rider.create({
      user_id: user._id,
      vehicle_type: vehicle_type || 'MOTORCYCLE',
      driving_license_no: driving_license_no ? driving_license_no.trim() : null,
      nid_number: nid_number ? nid_number.trim() : null,
      assigned_zones: Array.isArray(assigned_zones) ? assigned_zones : [],
      cash_in_hand_limit: Number(cash_in_hand_limit) || 3000,
    });
    wallet = await Wallet.create({ user_id: user._id });
  }

  if (role === USER_ROLES.RESTAURANT_OWNER) {
    const rawSlug = restaurant_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = rawSlug || `rest-${Date.now().toString().slice(-4)}`;

    const existingSlug = await Restaurant.findOne({ slug });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    restaurantProfile = await Restaurant.create({
      owner_id: user._id,
      zone_id,
      name: restaurant_name.trim(),
      slug,
      description: description ? description.trim() : '',
      address: restaurant_address.trim(),
      commission_rate: Math.max(0, Math.min(100, Number(commission_rate) || 10)),
    });
    wallet = await Wallet.create({ user_id: user._id });
  }

  const userObj = user.toJSON();
  delete userObj.password_hash;

  return {
    user: userObj,
    riderProfile,
    restaurantProfile,
    wallet,
  };
};

/**
 * admin updates an existing user profile and role-specific models
 * @param {string} userId
 * @param {object} payload
 * @returns {object}
 */
export const updateAdminUser = async (userId, payload = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('user not found');
  }

  // update name
  if (payload.name !== undefined) {
    if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
      throw ApiError.badRequest('name cannot be empty');
    }
    user.name = payload.name.trim();
  }

  // update phone number
  if (payload.phone_number !== undefined) {
    const normalizedPhone = normalizePhoneNumber(payload.phone_number);
    if (!normalizedPhone) {
      throw ApiError.badRequest('invalid bangladesh mobile number format (01xxxxxxxxx)');
    }
    if (normalizedPhone !== user.phone_number) {
      const existingPhone = await User.findOne({ phone_number: normalizedPhone, _id: { $ne: user._id } });
      if (existingPhone) {
        throw ApiError.conflict('a user with this phone number already exists');
      }
      user.phone_number = normalizedPhone;
    }
  }

  // update email
  if (payload.email !== undefined) {
    if (payload.email && typeof payload.email === 'string' && payload.email.trim()) {
      const cleanEmail = payload.email.toLowerCase().trim();
      if (cleanEmail !== user.email) {
        const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (existingEmail) {
          throw ApiError.conflict('a user with this email already exists');
        }
        user.email = cleanEmail;
      }
    } else {
      user.email = undefined;
    }
  }

  // update password
  if (payload.password && typeof payload.password === 'string' && payload.password.trim()) {
    if (payload.password.trim().length < 6) {
      throw ApiError.badRequest('password must be at least 6 characters');
    }
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(payload.password.trim(), salt);
  }

  await user.save();

  // update rider specifications if user is a rider
  let riderProfile = null;
  if (user.role === USER_ROLES.RIDER) {
    riderProfile = await Rider.findOne({ user_id: user._id });
    if (!riderProfile) {
      riderProfile = await Rider.create({
        user_id: user._id,
        vehicle_type: payload.vehicle_type || 'MOTORCYCLE',
        assigned_zones: Array.isArray(payload.assigned_zones) ? payload.assigned_zones : [],
        cash_in_hand_limit: Number(payload.cash_in_hand_limit) || 3000,
      });
    } else {
      if (payload.vehicle_type !== undefined) riderProfile.vehicle_type = payload.vehicle_type;
      if (payload.driving_license_no !== undefined) riderProfile.driving_license_no = payload.driving_license_no ? payload.driving_license_no.trim() : null;
      if (payload.nid_number !== undefined) riderProfile.nid_number = payload.nid_number ? payload.nid_number.trim() : null;
      if (payload.assigned_zones !== undefined && Array.isArray(payload.assigned_zones)) riderProfile.assigned_zones = payload.assigned_zones;
      if (payload.cash_in_hand_limit !== undefined) {
        const limit = Number(payload.cash_in_hand_limit);
        if (Number.isFinite(limit) && limit >= 0) riderProfile.cash_in_hand_limit = limit;
      }
      if (payload.is_online !== undefined) riderProfile.is_online = Boolean(payload.is_online);
      await riderProfile.save();
    }
  }

  // update restaurant specifications if user is a restaurant owner
  let restaurantProfile = null;
  if (user.role === USER_ROLES.RESTAURANT_OWNER) {
    restaurantProfile = await Restaurant.findOne({ owner_id: user._id });
    if (!restaurantProfile) {
      throw ApiError.notFound('restaurant profile not found for this owner account');
    }
    if (payload.restaurant_name && typeof payload.restaurant_name === 'string' && payload.restaurant_name.trim()) {
      restaurantProfile.name = payload.restaurant_name.trim();
    }
    if (payload.zone_id) {
      const zoneExists = await Zone.findById(payload.zone_id);
      if (zoneExists) restaurantProfile.zone_id = payload.zone_id;
    }
    if (payload.restaurant_address && typeof payload.restaurant_address === 'string' && payload.restaurant_address.trim()) {
      restaurantProfile.address = payload.restaurant_address.trim();
    }
    if (payload.commission_rate !== undefined) {
      const comm = Number(payload.commission_rate);
      if (Number.isFinite(comm) && comm >= 0 && comm <= 100) restaurantProfile.commission_rate = comm;
    }
    if (payload.description !== undefined) {
      restaurantProfile.description = payload.description ? payload.description.trim() : '';
    }
    if (payload.is_open !== undefined) {
      restaurantProfile.is_open = Boolean(payload.is_open);
    }
    await restaurantProfile.save();
  }

  const userObj = user.toJSON();
  delete userObj.password_hash;

  return {
    user: userObj,
    riderProfile,
    restaurantProfile,
  };
};
