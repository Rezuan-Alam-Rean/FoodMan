import mongoose from 'mongoose';

const uploadConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    uploadUrl: {
      type: String,
      required: [true, 'Upload URL is required'],
      trim: true,
    },
    load: {
      type: Number,
      default: 0,
      min: [0, 'Load count cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// compound index: prefer active configs with smallest load
uploadConfigSchema.index({ isActive: 1, load: 1 });

const UploadConfig = mongoose.model('UploadConfig', uploadConfigSchema);

export default UploadConfig;
