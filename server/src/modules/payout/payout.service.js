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
    payout_channel = 'BANK_TRANSFER',
    reference_txn_id,
    notes = '',
  } = {},
  adminUserId
) => {
  const payoutAmount = Number(amount);
  if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
    throw ApiError.badRequest('payout amount must be greater than zero');
  }

  if (
    !reference_txn_id ||
    typeof reference_txn_id !== 'string' ||
    !reference_txn_id.trim()
  ) {
    throw ApiError.badRequest('reference transaction id is required');
  }

  const recipient = await User.findById(recipient_user_id);
  if (!recipient) {
    throw ApiError.notFound('recipient user not found');
  }

  const wallet = await Wallet.findOne({ user_id: recipient_user_id });
  if (!wallet) {
    throw ApiError.notFound('recipient wallet not found');
  }

  // atomic conditional debit to prevent race condition or negative balances
  const debitedWallet = await Wallet.findOneAndUpdate(
    { _id: wallet._id, current_balance: { $gte: payoutAmount } },
    {
      $inc: {
        current_balance: -payoutAmount,
        total_settled_by_admin: payoutAmount,
      },
    },
    { new: true }
  );

  if (!debitedWallet) {
    throw ApiError.badRequest(
      `insufficient wallet balance (available: ${wallet.current_balance} bdt)`
    );
  }

  // record payout settlement
  const payout = await PayoutSettlement.create({
    wallet_id: wallet._id,
    recipient_user_id,
    amount: payoutAmount,
    payout_channel,
    reference_txn_id: reference_txn_id.trim(),
    disbursed_by_admin_id: adminUserId,
    notes: notes && typeof notes === 'string' ? notes.trim() : '',
  });

  // record ledger debit transaction
  await LedgerTransaction.create({
    wallet_id: wallet._id,
    payout_id: payout._id,
    type: LEDGER_TRANSACTION_TYPES.DEBIT_ADMIN_PAYOUT,
    amount: payoutAmount,
    balance_after: debitedWallet.current_balance,
    notes: `admin payout settlement via ${payout_channel} (ref: ${reference_txn_id.trim()})`,
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
