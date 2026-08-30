// global catalog category model for food items
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'category name is required'],
      unique: true,
      trim: true,
      maxlength: [80, 'category name cannot exceed 80 characters'],
    },
    image_url: {
      type: String,
      default: null,
      trim: true,
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

// index for active ordering
categorySchema.index({ is_active: 1, sort_order: 1 });

export const Category = mongoose.model('Category', categorySchema);

