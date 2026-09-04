// pusher client singleton for browser real-time subscriptions
import Pusher from 'pusher-js';

let pusherClientInstance: Pusher | null = null;

export const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
export const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';

/**
 * get or initialize singleton pusher client instance
 * @returns {Pusher | null}
 */
export function getPusherClient(): Pusher | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!PUSHER_KEY) {
    return null;
  }

  if (!pusherClientInstance) {
    pusherClientInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });
  }

  return pusherClientInstance;
}
