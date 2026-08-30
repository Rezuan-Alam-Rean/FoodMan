// order management data model with dual acceptance state machine
import mongoose from 'mongoose';
import { ORDER_STATUS } from '../../constants/index.js';

const orderItemSchema = new mongoose.Schema(
  {
    food_item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    selected_variant: {
      group_title: String,
      option_name: String,
      price_delta: Number,
    },
    selected_add_ons: [
      {
        name: String,
        price: Number,
      },
    ],
    total_price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    order_number: {
      type: String,
      required: [true, 'order number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'customer reference is required'],
      index: true,
    },
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'restaurant reference is required'],
      index: true,
    },
    rider_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
      default: null,
      index: true,
    },
    delivery_zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'delivery zone reference is required'],
      index: true,
    },
    delivery_subzone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subzone',
      required: [true, 'delivery subzone reference is required'],
      index: true,
    },
    user_address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserAddress',
      default: null,
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'order items are required'],
      validate: [(val) => val.length > 0, 'order must contain at least one item'],
    },
    food_subtotal: {
      type: Number,
      required: [true, 'food subtotal is required'],
      min: [0, 'subtotal cannot be negative'],
    },
    delivery_fee: {
      type: Number,
      required: [true, 'delivery fee is required'],
      min: [0, 'delivery fee cannot be negative'],
    },
    service_fee: {
      type: Number,
      default: 0,
      min: [0, 'service fee cannot be negative'],
    },
    grand_total: {
      type: Number,
      required: [true, 'grand total is required'],
      min: [0, 'grand total cannot be negative'],
    },
    customer_name: {
      type: String,
      required: [true, 'customer name is required'],
      trim: true,
    },
    customer_phone: {
      type: String,
      required: [true, 'customer phone is required'],
      trim: true,
    },
    delivery_address_text: {
      type: String,
      required: [true, 'delivery address text is required'],
      trim: true,
    },
    special_notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.LOOKING_FOR_RIDER,
      index: true,
    },
    cancellation_locked: {
      type: Boolean,
      default: false,
    },
    rider_accepted_at: {
      type: Date,
      default: null,
    },
    restaurant_accepted_at: {
      type: Date,
      default: null,
    },
    picked_up_at: {
      type: Date,
      default: null,
    },
    delivered_at: {
      type: Date,
      default: null,
    },
    cancelled_at: {
      type: Date,
      default: null,
    },
    cancellation_reason: {
      type: String,
      default: null,
      trim: true,
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

// composite indexes for efficient polling queries
orderSchema.index({ status: 1, delivery_zone_id: 1, rider_id: 1 });
orderSchema.index({ restaurant_id: 1, status: 1 });
orderSchema.index({ customer_id: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
