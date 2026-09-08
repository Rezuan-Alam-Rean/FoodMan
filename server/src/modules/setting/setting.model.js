// singleton system and platform configuration model
import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    platform_service_fee: {
      type: Number,
      default: 10,
      min: [0, 'platform service fee cannot be negative'],
    },
    official_mfs_number: {
      type: String,
      default: '01700-000000',
      trim: true,
    },
    official_mfs_provider: {
      type: String,
      default: 'bKash / Nagad / MFS',
      trim: true,
    },
    official_mfs_instructions: {
      type: String,
      default: 'Manual Send Money',
      trim: true,
    },
    is_mfs_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// singleton retrieval and auto-initialization helper
systemSettingSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      platform_service_fee: 10,
      official_mfs_number: '01700-000000',
      official_mfs_provider: 'bKash / Nagad / MFS',
      official_mfs_instructions: 'Manual Send Money',
      is_mfs_active: true,
    });
  }
  return settings;
};

export const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
