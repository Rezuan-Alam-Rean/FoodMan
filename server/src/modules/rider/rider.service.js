// delivery rider profile and zone assignment business logic
import { Rider } from './rider.model.js';
import { Order } from '../order/order.model.js';
import { Zone } from '../zone/zone.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ORDER_STATUS } from '../../constants/index.js';

/**
 * get rider profile for authenticated user
 * @param {string} userId
 * @returns {object}
 */
export const getRiderProfile = async (userId) => {
  let rider = await Rider.findOne({ user_id: userId })
    .populate('user_id', 'name phone_number email status')
    .populate('assigned_zones');

  if (!rider) {
    rider = await Rider.create({
      user_id: userId,
      is_online: false,
      assigned_zones: [],
    });
    rider = await rider.populate(['user_id', 'assigned_zones']);
  }

  // check if rider has any active delivery in progress
  const activeOrder = await Order.findOne({
    rider_id: rider._id,
    status: {
      $in: [
        ORDER_STATUS.RIDER_ACCEPTED,
        ORDER_STATUS.PREPARING,
        ORDER_STATUS.READY_FOR_PICKUP,
        ORDER_STATUS.PICKED_UP,
      ],
    },
  })
    .populate('restaurant_id', 'name address phone_number')
    .populate('customer_id', 'name phone_number')
    .populate('delivery_zone_id')
    .populate('delivery_subzone_id');

  return {
    rider,
    active_delivery: activeOrder,
  };
};

/**
 * toggle online/offline availability for rider
 * @param {string} userId
 * @param {boolean} isOnline
 * @returns {object}
 */
export const toggleRiderOnlineStatus = async (userId, isOnline) => {
  const rider = await Rider.findOne({ user_id: userId });
  if (!rider) {
    throw ApiError.notFound('rider profile not found');
  }

  if (typeof isOnline !== 'boolean') {
    throw ApiError.badRequest('is_online must be a boolean (true or false)');
  }

  rider.is_online = isOnline;
  await rider.save();

  return rider.populate('assigned_zones');
};

/**
 * update operational delivery zones for rider
 * @param {string} userId
 * @param {Array<string>} zoneIds
 * @returns {object}
 */
export const updateRiderAssignedZones = async (userId, zoneIds) => {
  if (!Array.isArray(zoneIds) || zoneIds.length === 0) {
    throw ApiError.badRequest('zone_ids must be a non-empty array');
  }

  const rider = await Rider.findOne({ user_id: userId });
  if (!rider) {
    throw ApiError.notFound('rider profile not found');
  }

  // validate zone ids
  const validZones = await Zone.find({ _id: { $in: zoneIds }, is_active: true });
  if (validZones.length !== zoneIds.length) {
    throw ApiError.badRequest('one or more zone ids are invalid or inactive');
  }

  rider.assigned_zones = validZones.map((z) => z._id);
  await rider.save();

  return rider.populate('assigned_zones');
};

/**
 * get unassigned available orders in rider assigned operational zones (http short polling endpoint)
 * @param {string} userId
 * @returns {Array}
 */
export const getAvailableZoneOrders = async (userId) => {
  const rider = await Rider.findOne({ user_id: userId });
  if (!rider || !rider.is_online) {
    return [];
  }

  if (!rider.assigned_zones || rider.assigned_zones.length === 0) {
    return [];
  }

  // query orders looking for rider in rider's assigned operational zones (fifo oldest first)
  const orders = await Order.find({
    status: ORDER_STATUS.LOOKING_FOR_RIDER,
    delivery_zone_id: { $in: rider.assigned_zones },
    rider_id: null,
  })
    .populate('restaurant_id', 'name address logo_url')
    .populate('delivery_zone_id', 'name fixed_delivery_fee')
    .populate('delivery_subzone_id', 'name custom_fixed_fee')
    .sort({ createdAt: 1 })
    .limit(20);

  return orders;
};
