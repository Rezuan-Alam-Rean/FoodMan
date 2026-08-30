// digital wallet and ledger statement business logic
import { Wallet } from './wallet.model.js';
import { LedgerTransaction } from './ledgerTransaction.model.js';
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
