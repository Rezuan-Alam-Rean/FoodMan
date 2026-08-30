// admin manual payout settlement disbursement model
import mongoose from 'mongoose';
import { PAYOUT_CHANNELS } from '../../constants/index.js';

const payoutSettlementSchema = new mongoose.Schema(
  {
    wallet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'wallet reference is required'],
      index: true,
    },
    recipient_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'recipient user reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'payout amount is required'],
      min: [0, 'amount cannot be negative'],
    },
    payout_channel: {
      type: String,
      enum: Object.values(PAYOUT_CHANNELS),
      required: [true, 'payout channel is required'],
    },
    reference_txn_id: {
      type: String,
      required: [true, 'reference transaction id is required'],
      trim: true,
      index: true,
    },
    disbursed_by_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'disbursing admin reference is required'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PayoutSettlement = mongoose.model(
  'PayoutSettlement',
  payoutSettlementSchema
);
