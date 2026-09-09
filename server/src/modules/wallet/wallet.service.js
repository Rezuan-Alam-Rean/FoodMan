// digital wallet and ledger statement business logic
import { Wallet } from './wallet.model.js';
import { LedgerTransaction } from './ledgerTransaction.model.js';
import { Order } from '../order/order.model.js';
import { PayoutSettlement } from '../payout/payoutSettlement.model.js';
import { ORDER_STATUS, USER_ROLES } from '../../constants/index.js';
import { ApiError } from '../../utils/apiError.js';

/**
 * get digital wallet and statement for authenticated user (vendor or rider)
 * @param {string} userId
 * @returns {object}
 */
export const getMyWalletStatement = async (userId) => {
  let wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) {
    wallet = await Wallet.create({
      user_id: userId,
      current_balance: 0,
      lifetime_earnings: 0,
      total_settled_by_admin: 0,
    });
  }

  const transactions = await LedgerTransaction.find({ wallet_id: wallet._id })
    .populate('order_id', 'order_number food_subtotal delivery_fee grand_total')
    .sort({ createdAt: -1 })
    .limit(50);

  return {
    wallet,
    transactions,
  };
};

/**
 * get all partner wallets for admin financial settlement desk
 * @returns {Array}
 */
export const getAllPartnerWallets = async () => {
  const wallets = await Wallet.find()
    .populate('user_id', 'name phone_number email role status')
    .sort({ current_balance: -1 });

  return wallets;
};

/**
 * get admin platform cashflow & net profit summary
 * @returns {object}
 */
export const getTreasurySummary = async () => {
  const [
    deliveredOrdersAgg,
    restaurantCommissionsAgg,
    riderCommissionsAgg,
    payoutsAgg,
    walletBalancesAgg,
  ] = await Promise.all([
    // Delivered orders total volume
    Order.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED } },
      {
        $group: {
          _id: null,
          total_customer_spent: { $sum: '$grand_total' },
          total_food_subtotal: { $sum: '$food_subtotal' },
          total_delivery_fees: { $sum: '$delivery_fee' },
          total_service_fees: { $sum: '$service_fee' },
          total_discounts: { $sum: '$discount_amount' },
          delivered_orders_count: { $sum: 1 },
        },
      },
    ]),

    // Vendor commissions from delivered orders
    Order.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED } },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant_id',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      { $unwind: { path: '$restaurant', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          food_subtotal: 1,
          commission_rate: { $ifNull: ['$restaurant.commission_rate', 10] },
        },
      },
      {
        $project: {
          vendor_commission: {
            $multiply: ['$food_subtotal', { $divide: ['$commission_rate', 100] }],
          },
        },
      },
      {
        $group: {
          _id: null,
          total_vendor_commission: { $sum: '$vendor_commission' },
        },
      },
    ]),

    // Rider commissions from delivered orders
    Order.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED, rider_id: { $ne: null } } },
      {
        $lookup: {
          from: 'riders',
          localField: 'rider_id',
          foreignField: '_id',
          as: 'rider',
        },
      },
      { $unwind: { path: '$rider', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          delivery_fee: 1,
          commission_rate: { $ifNull: ['$rider.commission_rate', 10] },
        },
      },
      {
        $project: {
          rider_commission: {
            $multiply: ['$delivery_fee', { $divide: ['$commission_rate', 100] }],
          },
        },
      },
      {
        $group: {
          _id: null,
          total_rider_commission: { $sum: '$rider_commission' },
        },
      },
    ]),

    // Total completed payouts
    PayoutSettlement.aggregate([
      {
        $group: {
          _id: null,
          total_disbursed: { $sum: '$amount' },
          payout_count: { $sum: 1 },
        },
      },
    ]),

    // Wallets outstanding & breakdown by user role (restaurants vs riders)
    Wallet.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$user.role',
          total_positive_balance: {
            $sum: { $cond: [{ $gt: ['$current_balance', 0] }, '$current_balance', 0] },
          },
          total_negative_balance: {
            $sum: { $cond: [{ $lt: ['$current_balance', 0] }, { $abs: '$current_balance' }, 0] },
          },
          total_settled_by_admin: { $sum: '$total_settled_by_admin' },
          total_lifetime_earnings: { $sum: '$lifetime_earnings' },
          wallet_count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalInflow = deliveredOrdersAgg[0]?.total_customer_spent || 0;
  const totalFoodSubtotal = deliveredOrdersAgg[0]?.total_food_subtotal || 0;
  const totalDeliveryFees = deliveredOrdersAgg[0]?.total_delivery_fees || 0;
  const totalServiceFees = deliveredOrdersAgg[0]?.total_service_fees || 0;
  const totalDiscounts = deliveredOrdersAgg[0]?.total_discounts || 0;
  const deliveredCount = deliveredOrdersAgg[0]?.delivered_orders_count || 0;

  const totalVendorCommission = Math.round(restaurantCommissionsAgg[0]?.total_vendor_commission || 0);
  const totalRiderCommission = Math.round(riderCommissionsAgg[0]?.total_rider_commission || 0);

  // Platform Net Profit = Restaurant Commission + Rider Commission + Platform Service Fees
  const platformNetProfit = totalVendorCommission + totalRiderCommission + totalServiceFees;

  const vendorWalletData =
    walletBalancesAgg.find((w) => w._id === USER_ROLES.RESTAURANT_OWNER) || {};
  const riderWalletData = walletBalancesAgg.find((w) => w._id === USER_ROLES.RIDER) || {};

  const totalVendorBalance = vendorWalletData.total_positive_balance || 0;
  // How much all riders will pay to Admin (COD Cash Collected / Liabilities)
  const totalRiderPayableToAdmin =
    riderWalletData.total_negative_balance ||
    (riderWalletData.total_positive_balance === 0 ? 0 : riderWalletData.total_positive_balance) ||
    0;
  const totalRiderEarningsDue = riderWalletData.total_positive_balance || 0;

  const totalWalletSettled = walletBalancesAgg.reduce(
    (sum, w) => sum + (w.total_settled_by_admin || 0),
    0
  );

  const totalOutflow = Math.max(
    payoutsAgg[0]?.total_disbursed || 0,
    totalWalletSettled
  );

  const pendingPayableLiability = totalVendorBalance + totalRiderEarningsDue;
  const netCashReserve = Math.max(0, totalInflow - totalOutflow);

  return {
    cashflow: {
      total_inflow: totalInflow, // Gross customer money in
      total_outflow: totalOutflow, // Money disbursed to vendors & riders
      net_cash_reserve: netCashReserve, // Retained in treasury
      pending_payable_liability: pendingPayableLiability, // Total unsettled partner balance Admin will pay
      total_vendor_balance: totalVendorBalance, // Money Admin owes to all restaurants (Admin will pay restaurants)
      total_rider_balance: totalRiderPayableToAdmin, // Money all riders owe & will pay to Admin (Riders will pay to Admin)
      total_rider_payable_to_admin: totalRiderPayableToAdmin,
      total_rider_earnings_due: totalRiderEarningsDue,
    },
    profit: {
      platform_net_profit: platformNetProfit, // Total FoodMan earnings
      vendor_commission_earned: totalVendorCommission,
      rider_commission_earned: totalRiderCommission,
      service_fees_collected: totalServiceFees,
    },
    metrics: {
      delivered_orders_count: deliveredCount,
      total_food_volume: totalFoodSubtotal,
      total_delivery_volume: totalDeliveryFees,
      total_discounts_granted: totalDiscounts,
      total_payouts_completed: payoutsAgg[0]?.payout_count || 0,
      total_vendor_wallets_count: vendorWalletData.wallet_count || 0,
      total_rider_wallets_count: riderWalletData.wallet_count || 0,
    },
  };
};
