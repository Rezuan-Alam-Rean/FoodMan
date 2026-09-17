// password reset code data model with ttl expiry
import mongoose from 'mongoose';

const passwordResetCodeSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user id is required'],
      index: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    code_hash: {
      type: String,
      required: [true, 'code hash is required'],
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    expires_at: {
      type: Date,
      required: [true, 'expiration time is required'],
      index: { expires: '15m' },
    },
  },
  {
    timestamps: true,
  }
);

// compound index for fast email and expiry lookups
passwordResetCodeSchema.index({ email: 1, expires_at: 1 });

export const PasswordResetCode = mongoose.model('PasswordResetCode', passwordResetCodeSchema);
