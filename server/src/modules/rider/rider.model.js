// delivery rider courier profile and operational zone model
import mongoose from 'mongoose';
import { VEHICLE_TYPES } from '../../constants/index.js';

const riderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user reference is required'],
      unique: true,
      index: true,
    },
    vehicle_type: {
      type: String,
      enum: Object.values(VEHICLE_TYPES),
      default: VEHICLE_TYPES.MOTORCYCLE,
    },
    driving_license_no: {
      type: String,
      trim: true,
      default: null,
    },
    nid_number: {
      type: String,
      trim: true,
      default: null,
    },
    is_online: {
      type: Boolean,
      default: false,
      index: true,
    },
    current_latitude: {
      type: Number,
      default: null,
    },
    current_longitude: {
      type: Number,
      default: null,
    },
    cash_in_hand_limit: {
      type: Number,
      default: 3000,
      min: [0, 'cash in hand limit cannot be negative'],
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
      min: 0,
    },
    assigned_zones: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone',
        index: true,
      },
    ],
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

// composite index to quickly discover online riders in a zone
riderSchema.index({ is_online: 1, assigned_zones: 1 });

export const Rider = mongoose.model('Rider', riderSchema);
