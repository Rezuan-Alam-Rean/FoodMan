// menu category model for grouping restaurant food items
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'restaurant reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'category name is required'],
      trim: true,
      maxlength: [80, 'category name cannot exceed 80 characters'],
    },
    sort_order: {
      type: Number,
      default: 0,
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

// compound index for ordering categories within a restaurant
categorySchema.index({ restaurant_id: 1, sort_order: 1 });

export const Category = mongoose.model('Category', categorySchema);
