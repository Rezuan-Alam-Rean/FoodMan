// order placement, state machine transitions, and financial ledger settlement logic
import { Order } from './order.model.js';
import { Payment } from '../payment/payment.model.js';
import { Restaurant } from '../restaurant/restaurant.model.js';
import { FoodItem } from '../menu/foodItem.model.js';
import { Zone } from '../zone/zone.model.js';
import { Subzone } from '../zone/subzone.model.js';
import { Rider } from '../rider/rider.model.js';
import { Wallet } from '../wallet/wallet.model.js';
import { LedgerTransaction } from '../wallet/ledgerTransaction.model.js';
import { resolveGuestCheckoutAuth } from '../auth/auth.service.js';
import { ApiError } from '../../utils/apiError.js';
import {
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  LEDGER_TRANSACTION_TYPES,
  USER_ROLES,
} from '../../constants/index.js';

/**
 * generate human-readable unique collision-resistant order number
 * @returns {string}
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timeEntropy = Date.now().toString(36).slice(-4).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `FM-${dateStr}-${timeEntropy}-${randomSuffix}`;
};

/**
 * create a new order (supports guest checkout and authenticated users)
 * @param {object} payload
 * @param {object|null} authenticatedUser
 * @returns {object}
 */
export const createNewOrder = async (payload = {}, authenticatedUser = null) => {
  if (!payload.delivery_address_text || typeof payload.delivery_address_text !== 'string' || !payload.delivery_address_text.trim()) {
    throw ApiError.badRequest('delivery address is required');
  }

  let customerUser = authenticatedUser;
  let authResult = null;

  // resolve guest user if not authenticated
  if (!customerUser) {
    authResult = await resolveGuestCheckoutAuth({
      name: payload.customer_name,
      phone_number: payload.customer_phone,
      zone_id: payload.delivery_zone_id,
      subzone_id: payload.delivery_subzone_id,
      detailed_address: payload.delivery_address_text,
    });
    customerUser = authResult.user;
  }

  // validate restaurant
  const restaurant = await Restaurant.findById(payload.restaurant_id);
  if (!restaurant) {
    throw ApiError.badRequest('specified restaurant does not exist');
  }

  if (!restaurant.is_open) {
    throw ApiError.badRequest('restaurant is currently closed');
  }

  // resolve delivery fee based on zone and subzone
  const zone = await Zone.findById(payload.delivery_zone_id);
  if (!zone || !zone.is_active) {
    throw ApiError.badRequest('selected delivery zone is inactive or invalid');
  }

  let delivery_fee = zone.fixed_delivery_fee;
  if (payload.delivery_subzone_id) {
    const subzone = await Subzone.findById(payload.delivery_subzone_id);
    if (subzone && subzone.custom_fixed_fee !== null) {
      delivery_fee = subzone.custom_fixed_fee;
    }
  }

  // validate order items and calculate food subtotal securely from database
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw ApiError.badRequest('order must contain at least one item');
  }

  let food_subtotal = 0;
  const processedItems = [];

  for (const item of payload.items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw ApiError.badRequest('item quantity must be a positive integer');
    }

    const foodItem = await FoodItem.findOne({
      _id: item.food_item_id,
      restaurant_id: restaurant._id,
      is_available: true,
    });

    if (!foodItem) {
      throw ApiError.badRequest(`item "${item.name || item.food_item_id}" is currently unavailable`);
    }

    let unit_price = foodItem.base_price;
    let matchedVariant = null;

    // lookup variant securely from database
    if (item.selected_variant) {
      const groupTitle = item.selected_variant.group_title || item.selected_variant.title;
      const optionName = item.selected_variant.option_name || item.selected_variant.name;

      if (groupTitle && optionName) {
        const group = foodItem.variants?.find((v) => v.title === groupTitle);
        const option = group?.options?.find((o) => o.name === optionName);
        if (!option) {
          throw ApiError.badRequest(`invalid variant option "${optionName}" for item "${foodItem.name}"`);
        }
        unit_price += Number(option.price_delta || 0);
        matchedVariant = {
          group_title: group.title,
          option_name: option.name,
          price_delta: Number(option.price_delta || 0),
        };
      }
    }

    // lookup add-ons securely from database
    let addOnsTotal = 0;
    const matchedAddOns = [];
    if (item.selected_add_ons && Array.isArray(item.selected_add_ons)) {
      for (const clientAddon of item.selected_add_ons) {
        const addonName = clientAddon.name;
        const storedAddon = foodItem.add_ons?.find((a) => a.name === addonName);
        if (!storedAddon) {
          throw ApiError.badRequest(`invalid add-on "${addonName}" for item "${foodItem.name}"`);
        }
        addOnsTotal += Number(storedAddon.price || 0);
        matchedAddOns.push({
          name: storedAddon.name,
          price: Number(storedAddon.price || 0),
        });
      }
    }

    const itemTotal = (unit_price + addOnsTotal) * quantity;
    food_subtotal += itemTotal;

    processedItems.push({
      food_item_id: foodItem._id,
      name: foodItem.name,
      unit_price: unit_price + addOnsTotal,
      quantity,
      selected_variant: matchedVariant,
      selected_add_ons: matchedAddOns,
      total_price: itemTotal,
    });
  }

  const service_fee = 10; // fixed platform service charge
  const grand_total = food_subtotal + delivery_fee + service_fee;

  const paymentMethod = payload.payment_method || PAYMENT_METHODS.COD;
  const initialOrderStatus =
    paymentMethod === PAYMENT_METHODS.COD
      ? ORDER_STATUS.LOOKING_FOR_RIDER
      : ORDER_STATUS.PENDING_PAYMENT;

  // create order
  const order = await Order.create({
    order_number: generateOrderNumber(),
    customer_id: customerUser._id,
    restaurant_id: restaurant._id,
    rider_id: null,
    delivery_zone_id: zone._id,
    delivery_subzone_id: payload.delivery_subzone_id || null,
    user_address_id: payload.user_address_id || null,
    items: processedItems,
    food_subtotal,
    delivery_fee,
    service_fee,
    grand_total,
    customer_name: customerUser.name,
    customer_phone: customerUser.phone_number,
    delivery_address_text: payload.delivery_address_text.trim(),
    special_notes: payload.special_notes ? String(payload.special_notes).trim() : '',
    status: initialOrderStatus,
    cancellation_locked: false,
  });

  // create payment record
  const payment = await Payment.create({
    order_id: order._id,
    method: paymentMethod,
    status: PAYMENT_STATUS.PENDING,
    amount: grand_total,
    sender_number: payload.mfs_sender_number || null,
    transaction_id: payload.mfs_transaction_id || null,
  });

  return {
    order,
    payment,
    auth: authResult ? { token: authResult.token, user: authResult.user } : null,
  };
};

/**
 * get live order status for tracking (http short polling)
 * @param {string} orderId
 * @param {object|null} user
 * @returns {object}
 */
export const getLiveOrderStatus = async (orderId, user = null) => {
  const order = await Order.findById(orderId)
    .populate('restaurant_id', 'name address phone_number logo_url owner_id')
    .populate('delivery_zone_id', 'name fixed_delivery_fee')
    .populate('delivery_subzone_id', 'name custom_fixed_fee')
    .populate({
      path: 'rider_id',
      populate: {
        path: 'user_id',
        select: 'name phone_number',
      },
    });

  if (!order) {
    throw ApiError.notFound('order not found');
  }

  // authorize caller if user is authenticated
  if (user && user.role !== USER_ROLES.ADMIN) {
    const isCustomer = order.customer_id.toString() === user._id.toString();
    const isRestaurant = order.restaurant_id?.owner_id?.toString() === user._id.toString();
    const isRider = order.rider_id?.user_id?._id?.toString() === user._id.toString();
    if (!isCustomer && !isRestaurant && !isRider) {
      throw ApiError.forbidden('you do not have permission to view this order');
    }
  }

  const payment = await Payment.findOne({ order_id: order._id });

  return {
    order,
    payment,
  };
};

/**
 * cancel an order before cooking starts
 * @param {string} orderId
 * @param {string} reason
 * @param {object} user
 * @returns {object}
 */
export const cancelOrder = async (orderId, reason, user) => {
  const order = await Order.findById(orderId).populate('restaurant_id');
  if (!order) {
    throw ApiError.notFound('order not found');
  }

  // authorize caller
  const isOwner = order.customer_id.toString() === user._id.toString();
  const isRestaurant = order.restaurant_id?.owner_id?.toString() === user._id.toString();
  if (user.role !== USER_ROLES.ADMIN && !isOwner && !isRestaurant) {
    throw ApiError.forbidden('you do not have permission to cancel this order');
  }

  // strictly forbid cancellation once food is in preparation or dual acceptance is locked
  if (
    order.cancellation_locked ||
    order.status === ORDER_STATUS.PREPARING ||
    order.status === ORDER_STATUS.READY_FOR_PICKUP ||
    order.status === ORDER_STATUS.PICKED_UP ||
    order.status === ORDER_STATUS.DELIVERED
  ) {
    throw ApiError.badRequest(
      'order cancellation is locked: food preparation is already in progress'
    );
  }

  order.status = ORDER_STATUS.CANCELLED;
  order.cancelled_at = new Date();
  order.cancellation_reason = reason || 'cancelled by user';
  await order.save();

  return order;
};

/**
 * get live orders for restaurant kitchen feed (http short polling)
 * @param {string} restaurantId
 * @param {object} user
 * @returns {Array}
 */
export const getRestaurantLiveOrders = async (restaurantId, user) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    throw ApiError.notFound('restaurant not found');
  }

  if (
    user.role === USER_ROLES.RESTAURANT_OWNER &&
    restaurant.owner_id.toString() !== user._id.toString()
  ) {
    throw ApiError.forbidden('you can only view orders for your own restaurant');
  }

  const orders = await Order.find({
    restaurant_id: restaurant._id,
    status: {
      $in: [
        ORDER_STATUS.LOOKING_FOR_RIDER,
        ORDER_STATUS.RIDER_ACCEPTED,
        ORDER_STATUS.PREPARING,
        ORDER_STATUS.READY_FOR_PICKUP,
      ],
    },
  })
    .populate('delivery_zone_id', 'name')
    .populate('delivery_subzone_id', 'name')
    .populate({
      path: 'rider_id',
      populate: {
        path: 'user_id',
        select: 'name phone_number',
      },
    })
    .sort({ createdAt: 1 });

  return orders;
};

/**
 * rider accepts delivery task (atomic claim)
 * @param {string} orderId
 * @param {string} riderUserId
 * @returns {object}
 */
export const riderAcceptOrder = async (orderId, riderUserId) => {
  const rider = await Rider.findOne({ user_id: riderUserId });
  if (!rider) {
    throw ApiError.notFound('rider profile not found');
  }

  // atomic claim condition
  const claimedOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: ORDER_STATUS.LOOKING_FOR_RIDER, rider_id: null },
    {
      $set: {
        rider_id: rider._id,
        rider_accepted_at: new Date(),
        status: ORDER_STATUS.RIDER_ACCEPTED,
      },
    },
    { new: true }
  );

  if (!claimedOrder) {
    throw ApiError.badRequest('order is no longer available or already claimed by another rider');
  }

  return claimedOrder.populate(['restaurant_id', 'delivery_zone_id']);
};

/**
 * restaurant accepts order and starts cooking (dual acceptance locked)
 * @param {string} orderId
 * @param {object} user
 * @returns {object}
 */
export const restaurantAcceptAndCook = async (orderId, user) => {
  const order = await Order.findById(orderId).populate('restaurant_id');
  if (!order) {
    throw ApiError.notFound('order not found');
  }

  if (
    user.role === USER_ROLES.RESTAURANT_OWNER &&
    order.restaurant_id.owner_id.toString() !== user._id.toString()
  ) {
    throw ApiError.forbidden('unauthorized to accept order for this restaurant');
  }

  if (
    order.status !== ORDER_STATUS.LOOKING_FOR_RIDER &&
    order.status !== ORDER_STATUS.RIDER_ACCEPTED
  ) {
    throw ApiError.badRequest(`order cannot start preparation from status "${order.status}"`);
  }

  order.status = ORDER_STATUS.PREPARING;
  order.restaurant_accepted_at = new Date();
  order.cancellation_locked = true; // customer cannot cancel after this point
  await order.save();

  return order;
};

/**
 * restaurant marks food ready for pickup
 * @param {string} orderId
 * @param {object} user
 * @returns {object}
 */
export const restaurantFoodReady = async (orderId, user) => {
  const order = await Order.findById(orderId).populate('restaurant_id');
  if (!order) {
    throw ApiError.notFound('order not found');
  }

  if (
    user.role === USER_ROLES.RESTAURANT_OWNER &&
    order.restaurant_id.owner_id.toString() !== user._id.toString()
  ) {
    throw ApiError.forbidden('unauthorized to update order for this restaurant');
  }

  if (order.status !== ORDER_STATUS.PREPARING) {
    throw ApiError.badRequest(`order cannot be marked ready from status "${order.status}"`);
  }

  order.status = ORDER_STATUS.READY_FOR_PICKUP;
  await order.save();

  return order;
};

/**
 * rider marks order as picked up
 * @param {string} orderId
 * @param {string} riderUserId
 * @returns {object}
 */
export const riderPickupOrder = async (orderId, riderUserId) => {
  const rider = await Rider.findOne({ user_id: riderUserId });
  const order = await Order.findById(orderId);

  if (!order || !rider || !order.rider_id || order.rider_id.toString() !== rider._id.toString()) {
    throw ApiError.forbidden('you are not assigned to this delivery');
  }

  if (
    order.status !== ORDER_STATUS.READY_FOR_PICKUP &&
    order.status !== ORDER_STATUS.PREPARING
  ) {
    throw ApiError.badRequest(`order cannot be picked up from status "${order.status}"`);
  }

  order.status = ORDER_STATUS.PICKED_UP;
  order.picked_up_at = new Date();
  await order.save();

  return order;
};

/**
 * rider marks order as delivered and settles financial ledgers atomically
 * @param {string} orderId
 * @param {string} riderUserId
 * @returns {object}
 */
export const riderDeliverOrder = async (orderId, riderUserId) => {
  const rider = await Rider.findOne({ user_id: riderUserId });
  const order = await Order.findById(orderId).populate('restaurant_id');

  if (!order || !rider || !order.rider_id || order.rider_id.toString() !== rider._id.toString()) {
    throw ApiError.forbidden('you are not assigned to this delivery');
  }

  // atomic status transition to delivered
  const deliveredOrder = await Order.findOneAndUpdate(
    { _id: orderId, status: ORDER_STATUS.PICKED_UP },
    {
      $set: {
        status: ORDER_STATUS.DELIVERED,
        delivered_at: new Date(),
      },
    },
    { new: true }
  ).populate('restaurant_id');

  if (!deliveredOrder) {
    const existing = await Order.findById(orderId);
    if (existing && existing.status === ORDER_STATUS.DELIVERED) {
      return existing;
    }
    throw ApiError.badRequest('order must be in PICKED_UP status before marking as delivered');
  }

  // update payment status
  const payment = await Payment.findOne({ order_id: order._id });
  if (payment && payment.method === PAYMENT_METHODS.COD) {
    payment.status = PAYMENT_STATUS.VERIFIED;
    await payment.save();
  }

  // update restaurant owner digital wallet
  const vendorOwnerId = order.restaurant_id.owner_id;
  let vendorWallet = await Wallet.findOne({ user_id: vendorOwnerId });
  if (!vendorWallet) {
    vendorWallet = await Wallet.create({ user_id: vendorOwnerId });
  }

  const commissionRate = order.restaurant_id.commission_rate || 10;
  const platformCommission = (order.food_subtotal * commissionRate) / 100;
  const netVendorEarning = order.food_subtotal - platformCommission;

  vendorWallet.current_balance += netVendorEarning;
  vendorWallet.lifetime_earnings += netVendorEarning;
  await vendorWallet.save();

  // create vendor ledger transaction
  await LedgerTransaction.create({
    wallet_id: vendorWallet._id,
    order_id: order._id,
    type: LEDGER_TRANSACTION_TYPES.CREDIT_FOOD_SALE,
    amount: netVendorEarning,
    balance_after: vendorWallet.current_balance,
    notes: `food sale earnings for order ${order.order_number} (minus ${commissionRate}% commission)`,
  });

  // update rider digital wallet
  let riderWallet = await Wallet.findOne({ user_id: riderUserId });
  if (!riderWallet) {
    riderWallet = await Wallet.create({ user_id: riderUserId });
  }

  // credit rider delivery fee earnings
  riderWallet.current_balance += order.delivery_fee;
  riderWallet.lifetime_earnings += order.delivery_fee;

  // if COD, debit cash collected liability (rider holds cash that belongs to admin)
  if (payment && payment.method === PAYMENT_METHODS.COD) {
    riderWallet.current_balance -= order.grand_total;
  }

  await riderWallet.save();

  // create rider delivery fee credit ledger
  await LedgerTransaction.create({
    wallet_id: riderWallet._id,
    order_id: order._id,
    type: LEDGER_TRANSACTION_TYPES.CREDIT_DELIVERY_FEE,
    amount: order.delivery_fee,
    balance_after:
      payment && payment.method === PAYMENT_METHODS.COD
        ? riderWallet.current_balance + order.grand_total
        : riderWallet.current_balance,
    notes: `delivery fee earned for order ${order.order_number}`,
  });

  // if COD, create debit ledger for cash-in-hand liability
  if (payment && payment.method === PAYMENT_METHODS.COD) {
    await LedgerTransaction.create({
      wallet_id: riderWallet._id,
      order_id: order._id,
      type: LEDGER_TRANSACTION_TYPES.DEBIT_COD_LIABILITY,
      amount: order.grand_total,
      balance_after: riderWallet.current_balance,
      notes: `collected cod cash liability for order ${order.order_number}`,
    });
  }

  return deliveredOrder;
};
