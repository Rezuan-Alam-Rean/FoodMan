// coupon management data model for restaurant-specific discount codes
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'coupon code is required'],
      uppercase: true,
      trim: true,
      index: true,
    },
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'restaurant reference is required'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    discount_type: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT'],
      default: 'PERCENTAGE',
      required: true,
    },
    discount_value: {
      type: Number,
      required: [true, 'discount value is required'],
      min: [0, 'discount value cannot be negative'],
    },
    min_order_amount: {
      type: Number,
      default: 0,
      min: [0, 'minimum order amount cannot be negative'],
    },
    max_discount_amount: {
      type: Number,
      default: null,
      min: [0, 'maximum discount amount cannot be negative'],
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    expiry_date: {
      type: Date,
      default: null,
    },
    usage_limit: {
      type: Number,
      default: null,
      min: 1,
    },
    usage_limit_per_user: {
      type: Number,
      default: null,
      min: 1,
    },
    usage_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
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

// composite index for restaurant + code lookup
couponSchema.index({ restaurant_id: 1, code: 1 }, { unique: true });
couponSchema.index({ restaurant_id: 1, is_active: 1 });

export const Coupon = mongoose.model('Coupon', couponSchema);
