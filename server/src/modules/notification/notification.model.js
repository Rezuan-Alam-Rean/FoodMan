// persistent notification model for all system personas
import mongoose from 'mongoose';
import {
  USER_ROLES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
} from '../../constants/index.js';

const notificationSchema = new mongoose.Schema(
  {
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'recipient is required'],
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPES),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(NOTIFICATION_PRIORITIES),
      default: NOTIFICATION_PRIORITIES.SILENT,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'message is required'],
      trim: true,
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// compound indexes for high-frequency user feed lookups
notificationSchema.index({ recipient_id: 1, is_read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
