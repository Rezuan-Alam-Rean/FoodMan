// admin manual payout settlement business logic
import { PayoutSettlement } from './payoutSettlement.model.js';
import { Wallet } from '../wallet/wallet.model.js';
import { LedgerTransaction } from '../wallet/ledgerTransaction.model.js';
import { User } from '../user/user.model.js';
import { ApiError } from '../../utils/apiError.js';
import { LEDGER_TRANSACTION_TYPES } from '../../constants/index.js';

/**
 * admin records and disburses manual payout to vendor or rider
 * @param {object} payload
 * @param {string} adminUserId
 * @returns {object}
 */
export const disburseManualPayout = async (
  {
    recipient_user_id,
    amount,
    payout_channel,
    reference_txn_id,
    notes = '',
  },
  adminUserId
) => {
  const recipient = await User.findById(recipient_user_id);
  if (!recipient) {
    throw ApiError.notFound('recipient user not found');
  }

  const wallet = await Wallet.findOne({ user_id: recipient_user_id });
  if (!wallet) {
    throw ApiError.notFound('recipient wallet not found');
  }

  const payoutAmount = Number(amount);
  if (payoutAmount <= 0) {
    throw ApiError.badRequest('payout amount must be greater than zero');
  }

  if (wallet.current_balance < payoutAmount) {
    throw ApiError.badRequest(
      `insufficient wallet balance (available: ${wallet.current_balance} bdt)`
    );
  }

  // debit wallet balance
  wallet.current_balance -= payoutAmount;
  wallet.total_settled_by_admin += payoutAmount;
  await wallet.save();

  // record payout settlement
  const payout = await PayoutSettlement.create({
    wallet_id: wallet._id,
    recipient_user_id,
    amount: payoutAmount,
    payout_channel,
    reference_txn_id: reference_txn_id.trim(),
    disbursed_by_admin_id: adminUserId,
    notes: notes ? notes.trim() : '',
  });

  // record ledger debit transaction
  await LedgerTransaction.create({
    wallet_id: wallet._id,
    payout_id: payout._id,
    type: LEDGER_TRANSACTION_TYPES.DEBIT_ADMIN_PAYOUT,
    amount: payoutAmount,
    balance_after: wallet.current_balance,
    notes: `admin payout settlement via ${payout_channel} (ref: ${reference_txn_id})`,
  });

  return payout;
};

/**
 * get payout settlement history for admin desk
 * @returns {Array}
 */
export const getPayoutSettlementHistory = async () => {
  const payouts = await PayoutSettlement.find()
    .populate('recipient_user_id', 'name phone_number email role')
    .populate('disbursed_by_admin_id', 'name phone_number')
    .sort({ createdAt: -1 });

  return payouts;
};
