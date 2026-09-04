// notification persistence and pusher real-time dispatch service
import { Notification } from './notification.model.js';
import { triggerSafe } from '../../config/pusher.js';
import { NOTIFICATION_PRIORITIES } from '../../constants/index.js';
import { ApiError } from '../../utils/apiError.js';
import { logger } from '../../utils/logger.js';

/**
 * dispatch notification: creates persistent db record (if recipient specified)
 * and broadcasts real-time pusher event to designated channels
 *
 * @param {object} params
 * @param {string|object} [params.recipientId] - User _id
 * @param {string} [params.role] - User role
 * @param {string|object} [params.orderId] - Associated Order _id
 * @param {string} params.type - NOTIFICATION_TYPES
 * @param {string} [params.priority=NOTIFICATION_PRIORITIES.SILENT] - ALARM or SILENT
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {object} [params.metadata={}] - Optional metadata (order_number, sound_variant, etc.)
 * @param {string|string[]} params.channels - Pusher channels to broadcast to
 * @param {string} params.event - Pusher event name
 * @returns {Promise<object>}
 */
export const dispatchNotification = async ({
  recipientId = null,
  role = null,
  orderId = null,
  type,
  priority = NOTIFICATION_PRIORITIES.SILENT,
  title,
  message,
  metadata = {},
  channels = [],
  event = 'notification:received',
}) => {
  let createdNotification = null;

  // persist to database if recipient is defined
  if (recipientId && role) {
    try {
      createdNotification = await Notification.create({
        recipient_id: recipientId,
        role,
        order_id: orderId || null,
        type,
        priority,
        title,
        message,
        is_read: false,
        metadata,
      });
    } catch (err) {
      logger.error(`[NotificationService] failed to persist notification: ${err.message}`);
    }
  }

  // assemble real-time pusher payload
  const hasAlarm = priority === NOTIFICATION_PRIORITIES.ALARM;
  const payload = {
    id: createdNotification?._id?.toString() || `notify-${Date.now()}`,
    type,
    priority,
    has_alarm: hasAlarm,
    title,
    message,
    order_id: orderId ? orderId.toString() : null,
    metadata,
    created_at: createdNotification?.createdAt || new Date(),
  };

  // broadcast to targeted pusher channels
  if (channels && (Array.isArray(channels) ? channels.length > 0 : Boolean(channels))) {
    await triggerSafe(channels, event, payload);
  }

  return { notification: createdNotification, payload };
};

/**
 * get paginated notifications for an authenticated user
 * @param {string} userId
 * @param {object} query
 * @returns {Promise<object>}
 */
export const getUserNotifications = async (userId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { recipient_id: userId };

  if (query.is_read !== undefined && query.is_read !== '') {
    filter.is_read = query.is_read === 'true' || query.is_read === true;
  }

  if (query.priority) {
    filter.priority = query.priority.toUpperCase();
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('order_id', 'order_number status grand_total customer_name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient_id: userId, is_read: false }),
  ]);

  return {
    notifications,
    unread_count: unreadCount,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * get total unread count for user
 * @param {string} userId
 * @returns {Promise<number>}
 */
export const getUnreadNotificationCount = async (userId) => {
  return await Notification.countDocuments({ recipient_id: userId, is_read: false });
};

/**
 * mark a single notification as read
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient_id: userId },
    { $set: { is_read: true } },
    { new: true }
  );

  if (!notification) {
    throw ApiError.notFound('notification not found');
  }

  return notification;
};

/**
 * mark all notifications as read for a user
 * @param {string} userId
 * @returns {Promise<object>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient_id: userId, is_read: false },
    { $set: { is_read: true } }
  );

  return { updated_count: result.modifiedCount };
};
