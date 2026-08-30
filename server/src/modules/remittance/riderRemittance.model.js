// rider cod cash collection remittance model for admin reconciliation
import mongoose from 'mongoose';
import { REMITTANCE_STATUS, REMITTANCE_METHODS } from '../../constants/index.js';

const riderRemittanceSchema = new mongoose.Schema(
  {
    rider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
      required: [true, 'rider reference is required'],
      index: true,
    },
    order_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    amount: {
      type: Number,
      required: [true, 'remittance amount is required'],
      min: [0, 'amount cannot be negative'],
    },
    payment_method: {
      type: String,
      enum: Object.values(REMITTANCE_METHODS),
      required: [true, 'payment channel is required'],
    },
    sender_account_no: {
      type: String,
      required: [true, 'sender account number is required'],
      trim: true,
    },
    transaction_reference: {
      type: String,
      required: [true, 'transaction reference id is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(REMITTANCE_STATUS),
      default: REMITTANCE_STATUS.PENDING_VERIFICATION,
      index: true,
    },
    verified_by_admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verified_at: {
      type: Date,
      default: null,
    },
    admin_notes: {
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

export const RiderRemittance = mongoose.model(
  'RiderRemittance',
  riderRemittanceSchema
);
