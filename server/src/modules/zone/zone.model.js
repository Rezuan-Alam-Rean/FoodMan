// delivery zone data model with fixed fee configuration
import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'zone name is required'],
      unique: true,
      trim: true,
      maxlength: [80, 'zone name cannot exceed 80 characters'],
      index: true,
    },
    city: {
      type: String,
      default: 'Dhaka',
      trim: true,
      maxlength: [80, 'city name cannot exceed 80 characters'],
      index: true,
    },
    fixed_delivery_fee: {
      type: Number,
      required: [true, 'fixed delivery fee is required'],
      min: [0, 'fixed delivery fee cannot be negative'],
      default: 100,
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

// virtual populate for subzones
zoneSchema.virtual('subzones', {
  ref: 'Subzone',
  localField: '_id',
  foreignField: 'zone_id',
});

export const Zone = mongoose.model('Zone', zoneSchema);
