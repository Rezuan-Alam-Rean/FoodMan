// subzone data model nested under primary delivery zones
import mongoose from 'mongoose';

const subzoneSchema = new mongoose.Schema(
  {
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'parent zone reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'subzone name is required'],
      trim: true,
      maxlength: [100, 'subzone name cannot exceed 100 characters'],
    },
    custom_fixed_fee: {
      type: Number,
      default: null,
      min: [0, 'custom fixed fee cannot be negative'],
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

// compound unique index for subzone name within a zone
subzoneSchema.index({ zone_id: 1, name: 1 }, { unique: true });

export const Subzone = mongoose.model('Subzone', subzoneSchema);
