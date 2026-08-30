// customer rating and review model for food and delivery
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'order reference is required'],
      unique: true,
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
    food_rating: {
      type: Number,
      min: [1, 'rating must be at least 1'],
      max: [5, 'rating cannot exceed 5'],
      default: null,
    },
    food_review: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'review cannot exceed 500 characters'],
    },
    rider_rating: {
      type: Number,
      min: [1, 'rating must be at least 1'],
      max: [5, 'rating cannot exceed 5'],
      default: null,
    },
    rider_review: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'review cannot exceed 500 characters'],
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

export const Review = mongoose.model('Review', reviewSchema);
