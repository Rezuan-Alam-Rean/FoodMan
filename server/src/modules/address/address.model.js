// user saved address model linked with zone and subzone hierarchy
import mongoose from 'mongoose';
import { ADDRESS_LABELS } from '../../constants/index.js';

const addressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user reference is required'],
      index: true,
    },
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'delivery zone reference is required'],
      index: true,
    },
    subzone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subzone',
      default: null,
      index: true,
    },
    address_label: {
      type: String,
      enum: Object.values(ADDRESS_LABELS),
      default: ADDRESS_LABELS.HOME,
    },
    detailed_address: {
      type: String,
      required: [true, 'detailed address is required'],
      trim: true,
      maxlength: [300, 'address cannot exceed 300 characters'],
    },
    contact_person_name: {
      type: String,
      required: [true, 'contact person name is required'],
      trim: true,
      maxlength: [100, 'contact name cannot exceed 100 characters'],
    },
    contact_phone: {
      type: String,
      required: [true, 'contact phone is required'],
      trim: true,
    },
    is_default: {
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

// user index for retrieving address book
addressSchema.index({ user_id: 1, is_default: -1 });

export const UserAddress = mongoose.model('UserAddress', addressSchema);
