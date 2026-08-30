// rider courier profile and operational zone business logic
import { Rider } from './rider.model.js';
import { Zone } from '../zone/zone.model.js';
import { Order } from '../order/order.model.js';
import { Wallet } from '../wallet/wallet.model.js';
import { ApiError } from '../../utils/apiError.js';
import { ORDER_STATUS } from '../../constants/index.js';

/**
 * get authenticated rider profile with assigned zones and wallet
 * @param {string} userId
 * @returns {object}
 */
export const getRiderProfile = async (userId) => {
  let rider = await Rider.findOne({ user_id: userId }).populate('assigned_zones');
  if (!rider) {
    rider = await Rider.create({
      user_id: userId,
      is_online: false,
      assigned_zones: [],
    });
  }

  const wallet = await Wallet.findOne({ user_id: userId });

  // find any active delivery in progress for this rider
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
    .populate('restaurant_id')
    .populate('delivery_zone_id')
    .populate('delivery_subzone_id');

  return {
    rider,
    wallet,
    activeOrder,
  };
};

/**
 * toggle rider online availability status
 * @param {string} userId
 * @param {boolean} isOnline
 * @returns {object}
 */
export const toggleRiderOnlineStatus = async (userId, isOnline) => {
  const rider = await Rider.findOne({ user_id: userId });
  if (!rider) {
    throw ApiError.notFound('rider profile not found');
  }

  rider.is_online = Boolean(isOnline);
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
  const rider = await Rider.findOne({ user_id: userId });
  if (!rider) {
    throw ApiError.notFound('rider profile not found');
  }

  // validate zone ids
  const validZones = await Zone.find({ _id: { $in: zoneIds }, is_active: true });
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

  // query orders looking for rider in rider's assigned operational zones
  const orders = await Order.find({
    status: ORDER_STATUS.LOOKING_FOR_RIDER,
    delivery_zone_id: { $in: rider.assigned_zones },
    rider_id: null,
  })
    .populate('restaurant_id', 'name address logo_url')
    .populate('delivery_zone_id', 'name fixed_delivery_fee')
    .populate('delivery_subzone_id', 'name custom_fixed_fee')
    .sort({ createdAt: -1 })
    .limit(20);

  return orders;
};
