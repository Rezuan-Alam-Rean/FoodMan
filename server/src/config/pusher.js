// pusher server instance and safe event dispatcher
import Pusher from 'pusher';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.PUSHER_CLUSTER,
  useTLS: true,
});

/**
 * safely trigger a pusher event without throwing unhandled exceptions
 * @param {string|string[]} channels
 * @param {string} event
 * @param {object} data
 * @returns {Promise<boolean>}
 */
export const triggerSafe = async (channels, event, data) => {
  try {
    const channelList = Array.isArray(channels) ? channels : [channels];
    if (channelList.length === 0) return false;

    await pusher.trigger(channelList, event, data);
    return true;
  } catch (error) {
    logger.error(`[Pusher] trigger failed for event ${event}: ${error.message}`);
    return false;
  }
};
