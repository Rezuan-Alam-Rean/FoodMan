// double-entry audit ledger transaction model
import mongoose from 'mongoose';
import { LEDGER_TRANSACTION_TYPES } from '../../constants/index.js';

const ledgerTransactionSchema = new mongoose.Schema(
  {
    wallet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: [true, 'wallet reference is required'],
      index: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    remittance_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiderRemittance',
      default: null,
    },
    payout_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayoutSettlement',
      default: null,
    },
    type: {
      type: String,
      enum: Object.values(LEDGER_TRANSACTION_TYPES),
      required: [true, 'transaction type is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'amount is required'],
      min: [0, 'amount cannot be negative'],
    },
    balance_after: {
      type: Number,
      required: [true, 'balance after is required'],
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

// index for wallet statement queries
ledgerTransactionSchema.index({ wallet_id: 1, createdAt: -1 });

export const LedgerTransaction = mongoose.model(
  'LedgerTransaction',
  ledgerTransactionSchema
);
