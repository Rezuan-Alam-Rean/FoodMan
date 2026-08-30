// admin operational desk and payment verification business logic
import { Payment } from '../payment/payment.model.js';
import { Order } from '../order/order.model.js';
import { RiderRemittance } from '../remittance/riderRemittance.model.js';
import { ApiError } from '../../utils/apiError.js';
import {
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  REMITTANCE_STATUS,
  ORDER_STATUS,
} from '../../constants/index.js';

/**
 * get aggregate metric counts for admin control tower (http short polling)
 * @returns {object}
 */
export const getAdminDeskMetricCounts = async () => {
  const [pendingMfsCount, pendingRemittanceCount, activeOrdersCount] =
    await Promise.all([
      Payment.countDocuments({
        status: PAYMENT_STATUS.PENDING,
        method: { $ne: PAYMENT_METHODS.COD },
      }),
      RiderRemittance.countDocuments({
        status: REMITTANCE_STATUS.PENDING_VERIFICATION,
      }),
      Order.countDocuments({
        status: {
          $in: [
            ORDER_STATUS.LOOKING_FOR_RIDER,
            ORDER_STATUS.RIDER_ACCEPTED,
            ORDER_STATUS.PREPARING,
            ORDER_STATUS.READY_FOR_PICKUP,
            ORDER_STATUS.PICKED_UP,
          ],
        },
      }),
    ]);

  return {
    pending_mfs_verifications: pendingMfsCount,
    pending_cod_remittances: pendingRemittanceCount,
    active_orders_in_progress: activeOrdersCount,
  };
};

/**
 * get pending manual mfs payments for admin verification desk
 * @returns {Array}
 */
export const getPendingMfsPayments = async () => {
  const payments = await Payment.find({
    status: PAYMENT_STATUS.PENDING,
    method: { $ne: PAYMENT_METHODS.COD },
  })
    .populate({
      path: 'order_id',
      populate: [
        { path: 'customer_id', select: 'name phone_number' },
        { path: 'restaurant_id', select: 'name address' },
        { path: 'delivery_zone_id', select: 'name' },
      ],
    })
    .sort({ createdAt: -1 });

  return payments;
};

/**
 * admin verifies or rejects customer manual mfs transaction
 * @param {string} paymentId
 * @param {string} status ('VERIFIED' or 'FAILED')
 * @param {string} adminUserId
 * @param {string} notes
 * @returns {object}
 */
export const verifyManualMfsPayment = async (
  paymentId,
  status,
  adminUserId,
  notes = ''
) => {
  if (![PAYMENT_STATUS.VERIFIED, PAYMENT_STATUS.FAILED].includes(status)) {
    throw ApiError.badRequest('status must be either VERIFIED or FAILED');
  }

  // atomic conditional transition for pending payment
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: PAYMENT_STATUS.PENDING },
    {
      $set: {
        status,
        verified_by_admin_id: adminUserId,
        verified_at: new Date(),
        notes: notes && typeof notes === 'string' ? notes.trim() : '',
      },
    },
    { new: true }
  );

  if (!payment) {
    const existing = await Payment.findById(paymentId);
    if (!existing) {
      throw ApiError.notFound('payment record not found');
    }
    throw ApiError.badRequest('payment has already been processed');
  }

  // update associated order status
  const order = await Order.findById(payment.order_id);
  if (order) {
    if (status === PAYMENT_STATUS.VERIFIED) {
      // order enters active pool for zone riders to claim
      order.status = ORDER_STATUS.LOOKING_FOR_RIDER;
    } else {
      order.status = ORDER_STATUS.CANCELLED;
      order.cancelled_at = new Date();
      order.cancellation_reason = 'payment verification rejected by admin';
    }
    await order.save();
  }

  return { payment, order };
};
