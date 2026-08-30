// digital wallet account model for vendors and riders managed via ledger entries
import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user reference is required'],
      unique: true,
      index: true,
    },
    current_balance: {
      type: Number,
      default: 0,
    },
    lifetime_earnings: {
      type: Number,
      default: 0,
      min: [0, 'lifetime earnings cannot be negative'],
    },
    total_settled_by_admin: {
      type: Number,
      default: 0,
      min: [0, 'total settled cannot be negative'],
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

// virtual populate for ledger history
walletSchema.virtual('transactions', {
  ref: 'LedgerTransaction',
  localField: '_id',
  foreignField: 'wallet_id',
});

export const Wallet = mongoose.model('Wallet', walletSchema);
