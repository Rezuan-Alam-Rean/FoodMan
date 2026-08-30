// rider cod cash remittance and admin reconciliation business logic
import { RiderRemittance } from './riderRemittance.model.js';
import { Rider } from '../rider/rider.model.js';
import { Wallet } from '../wallet/wallet.model.js';
import { LedgerTransaction } from '../wallet/ledgerTransaction.model.js';
import { ApiError } from '../../utils/apiError.js';
import { REMITTANCE_STATUS, LEDGER_TRANSACTION_TYPES } from '../../constants/index.js';

/**
 * rider submits cod remittance to admin
 * @param {string} riderUserId
 * @param {object} payload
 * @returns {object}
 */
export const submitRiderRemittance = async (
  riderUserId,
  {
    amount,
    payment_method = 'BKASH',
    sender_account_no,
    transaction_reference,
    order_ids = [],
  } = {}
) => {
  const parsedAmount = Number(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw ApiError.badRequest('amount must be a positive number');
  }

  if (
    !sender_account_no ||
    typeof sender_account_no !== 'string' ||
    !sender_account_no.trim() ||
    !transaction_reference ||
    typeof transaction_reference !== 'string' ||
    !transaction_reference.trim()
  ) {
    throw ApiError.badRequest('sender_account_no and transaction_reference are required');
  }

  const rider = await Rider.findOne({ user_id: riderUserId });
  if (!rider) {
    throw ApiError.notFound('rider profile not found');
  }

  const remittance = await RiderRemittance.create({
    rider_id: rider._id,
    amount: parsedAmount,
    payment_method,
    sender_account_no: sender_account_no.trim(),
    transaction_reference: transaction_reference.trim(),
    order_ids: Array.isArray(order_ids) ? order_ids : [],
    status: REMITTANCE_STATUS.PENDING_VERIFICATION,
  });

  return remittance;
};

/**
 * get remittance history for authenticated rider
 * @param {string} riderUserId
 * @returns {Array}
 */
export const getMyRemittances = async (riderUserId) => {
  const rider = await Rider.findOne({ user_id: riderUserId });
  if (!rider) {
    throw ApiError.notFound('rider profile not found');
  }

  const remittances = await RiderRemittance.find({ rider_id: rider._id })
    .sort({ createdAt: -1 })
    .limit(30);

  return remittances;
};

/**
 * get all remittances for admin reconciliation desk
 * @param {string} statusFilter
 * @returns {Array}
 */
export const getAdminRemittances = async (statusFilter) => {
  const filter = {};
  if (statusFilter) {
    filter.status = statusFilter;
  }

  const remittances = await RiderRemittance.find(filter)
    .populate({
      path: 'rider_id',
      populate: {
        path: 'user_id',
        select: 'name phone_number email',
      },
    })
    .sort({ createdAt: -1 });

  return remittances;
};

/**
 * admin approves or rejects cod remittance (clears rider liability on approve)
 * @param {string} remittanceId
 * @param {string} status
 * @param {string} adminNotes
 * @param {string} adminUserId
 * @returns {object}
 */
export const verifyRiderRemittance = async (
  remittanceId,
  status,
  adminNotes,
  adminUserId
) => {
  if (
    status !== REMITTANCE_STATUS.APPROVED &&
    status !== REMITTANCE_STATUS.REJECTED
  ) {
    throw ApiError.badRequest('status must be either APPROVED or REJECTED');
  }

  const remittance = await RiderRemittance.findById(remittanceId).populate('rider_id');
  if (!remittance) {
    throw ApiError.notFound('remittance submission not found');
  }

  if (remittance.status !== REMITTANCE_STATUS.PENDING_VERIFICATION) {
    throw ApiError.badRequest('remittance has already been processed');
  }

  remittance.status = status;
  remittance.admin_notes = adminNotes && typeof adminNotes === 'string' ? adminNotes.trim() : '';
  remittance.verified_by_admin_id = adminUserId;
  remittance.verified_at = new Date();
  await remittance.save();

  // if approved, clear rider cash liability in digital wallet
  if (status === REMITTANCE_STATUS.APPROVED) {
    const riderUserId = remittance.rider_id.user_id;
    let riderWallet = await Wallet.findOne({ user_id: riderUserId });
    if (!riderWallet) {
      riderWallet = await Wallet.create({ user_id: riderUserId });
    }

    riderWallet.current_balance += remittance.amount; // offsets negative cash liability
    await riderWallet.save();

    // create ledger transaction
    await LedgerTransaction.create({
      wallet_id: riderWallet._id,
      remittance_id: remittance._id,
      type: LEDGER_TRANSACTION_TYPES.CREDIT_COD_REMITTANCE,
      amount: remittance.amount,
      balance_after: riderWallet.current_balance,
      notes: `admin verified cod remittance (ref: ${remittance.transaction_reference})`,
    });
  }

  return remittance;
};
