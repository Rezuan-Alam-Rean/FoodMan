// order payment transaction model for cod and manual mfs
import mongoose from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUS } from '../../constants/index.js';

const paymentSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'order reference is required'],
      unique: true,
      index: true,
    },
    method: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      required: [true, 'payment method is required'],
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'payment amount is required'],
      min: [0, 'payment amount cannot be negative'],
    },
    sender_number: {
      type: String,
      trim: true,
      default: null,
    },
    transaction_id: {
      type: String,
      trim: true,
      default: null,
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

export const Payment = mongoose.model('Payment', paymentSchema);
