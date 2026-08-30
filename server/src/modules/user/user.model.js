// user data model with phone first primary identity
import mongoose from 'mongoose';
import { USER_ROLES, USER_STATUS } from '../../constants/index.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
      maxlength: [100, 'name cannot exceed 100 characters'],
    },
    phone_number: {
      type: String,
      required: [true, 'phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'please provide a valid email address'],
    },
    password_hash: {
      type: String,
      default: null,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.password_hash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// indexes for fast phone and role lookups
userSchema.index({ phone_number: 1, role: 1 });

export const User = mongoose.model('User', userSchema);
