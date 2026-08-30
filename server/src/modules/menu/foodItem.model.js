// individual food item and dish catalog model
import mongoose from 'mongoose';

const variantOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price_delta: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const variantGroupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [variantOptionSchema],
  },
  { _id: true }
);

const addOnOptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const foodItemSchema = new mongoose.Schema(
  {
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'restaurant reference is required'],
      index: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'category reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'food item name is required'],
      trim: true,
      maxlength: [150, 'name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'description cannot exceed 500 characters'],
    },
    image_url: {
      type: String,
      default: null,
      trim: true,
    },
    base_price: {
      type: Number,
      required: [true, 'base price is required'],
      min: [0, 'price cannot be negative'],
    },
    is_available: {
      type: Boolean,
      default: true,
      index: true,
    },
    variants: [variantGroupSchema],
    add_ons: [addOnOptionSchema],
    is_vegetarian: {
      type: Boolean,
      default: false,
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

// index for efficient catalog search
foodItemSchema.index({ restaurant_id: 1, category_id: 1, is_available: 1 });

export const FoodItem = mongoose.model('FoodItem', foodItemSchema);
