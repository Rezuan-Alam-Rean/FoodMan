// restaurant vendor profile model
import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'restaurant owner reference is required'],
      unique: true,
      index: true,
    },
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'primary zone reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'restaurant name is required'],
      trim: true,
      maxlength: [120, 'restaurant name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'description cannot exceed 500 characters'],
    },
    logo_url: {
      type: String,
      default: null,
      trim: true,
    },
    cover_image_url: {
      type: String,
      default: null,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'physical address is required'],
      trim: true,
      maxlength: [300, 'address cannot exceed 300 characters'],
    },
    commission_rate: {
      type: Number,
      default: 10,
      min: [0, 'commission rate cannot be negative'],
      max: [100, 'commission rate cannot exceed 100 percent'],
    },
    is_open: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating_avg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    total_ratings: {
      type: Number,
      default: 0,
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

// virtual populate for food items
restaurantSchema.virtual('food_items', {
  ref: 'FoodItem',
  localField: '_id',
  foreignField: 'restaurant_id',
});

export const Restaurant = mongoose.model('Restaurant', restaurantSchema);
