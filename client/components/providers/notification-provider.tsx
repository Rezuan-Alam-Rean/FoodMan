// unified real-time notification listener, audio alarm trigger, and toast provider
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getPusherClient } from '@/lib/pusher';
import { playAlarmSound, stopActiveAlarm } from '@/lib/audio-chime';
import { useAuth } from '@/hooks/use-auth';
import { useMyRestaurantQuery } from '@/hooks/queries/use-restaurant-queries';
import { useRiderProfileQuery } from '@/hooks/queries/use-rider-queries';
import { NOTIFICATION_KEYS } from '@/hooks/queries/use-notification-queries';
import type { NotificationItem } from '@/types';
import {
  Bell,
  Utensils,
  Bike,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface ToastNotification extends NotificationItem {
  toastId: string;
}

interface NotificationContextValue {
  activeToasts: ToastNotification[];
  dismissToast: (toastId: string) => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  activeToasts: [],
  dismissToast: () => {},
});

export const useRealtimeNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user, role, isAuthenticated } = useAuth();
  const [activeToasts, setActiveToasts] = useState<ToastNotification[]>([]);
  const [mounted, setMounted] = useState(false);
  const seenNotificationIdsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    setMounted(true);
  }, []);

  const userId = user?._id || user?.id;

  // fetch restaurant profile if user is a restaurant owner
  const isRestaurantOwner = isAuthenticated && role === 'RESTAURANT_OWNER';
  const { data: restaurant } = useMyRestaurantQuery(isRestaurantOwner);
  const restaurantId = restaurant?._id || restaurant?.id;

  // fetch rider profile if user is a courier
  const isRider = isAuthenticated && role === 'RIDER';
  const { data: riderData } = useRiderProfileQuery(isRider);
  const rider = riderData?.rider;
  const riderId = rider?._id || rider?.id;
  const assignedZones = Array.isArray(rider?.assigned_zones) ? rider.assigned_zones : [];

  const dismissToast = useCallback((toastId: string) => {
    setActiveToasts((prev) => {
      const target = prev.find((t) => t.toastId === toastId);
      if (target?.priority === 'ALARM' || target?.has_alarm) {
        stopActiveAlarm();
      }
      return prev.filter((t) => t.toastId !== toastId);
    });
  }, []);

  const handleIncomingNotification = useCallback(
    (data: any) => {
      if (!data) return;

      // prevent duplicate toasts within a 4-second window
      const notifKey = data.order_id
        ? `${data.type}-${data.order_id}`
        : String(data.id || `${data.type}-${data.title || ''}`);
      const now = Date.now();
      const lastSeen = seenNotificationIdsRef.current.get(notifKey);
      if (lastSeen && now - lastSeen < 4000) {
        return;
      }
      seenNotificationIdsRef.current.set(notifKey, now);

      // clean up old memory entries
      if (seenNotificationIdsRef.current.size > 80) {
        for (const [k, timestamp] of seenNotificationIdsRef.current.entries()) {
          if (now - timestamp > 10000) {
            seenNotificationIdsRef.current.delete(k);
          }
        }
      }

      const isAlarm = data.priority === 'ALARM' || data.has_alarm === true;
      const soundVariant = data.metadata?.sound_variant || 'food_ready_delivery';

      // 30-40 second continuous alarm loop for rider and restaurant
      const isRiderOrRestaurant =
        role === 'RIDER' ||
        role === 'RESTAURANT_OWNER' ||
        data.role === 'RIDER' ||
        data.role === 'RESTAURANT_OWNER' ||
        soundVariant === 'kitchen_order' ||
        soundVariant === 'rider_offer';

      const isLongAlarm = isAlarm && isRiderOrRestaurant;

      // 1. play audible alarm if priority is ALARM (35s continuous loop for rider/restaurant)
      if (isAlarm) {
        playAlarmSound(soundVariant, { isLongAlarm, durationSeconds: 35 });
      }

      // 2. add to floating active toasts
      const toastId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const toastItem: ToastNotification = {
        toastId,
        id: data.id || toastId,
        _id: data.id || toastId,
        recipient_id: data.recipient_id || userId,
        role: data.role || role || 'CUSTOMER',
        order_id: data.order_id || null,
        type: data.type || 'ORDER_NEW',
        priority: isAlarm ? 'ALARM' : 'SILENT',
        has_alarm: isAlarm,
        title: data.title || 'Order Update',
        message: data.message || '',
        is_read: false,
        metadata: data.metadata || {},
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setActiveToasts((prev) => {
        const isDuplicate = prev.some(
          (t) =>
            t.id === toastItem.id ||
            (t.type === toastItem.type &&
              t.order_id === toastItem.order_id &&
              t.title === toastItem.title)
        );
        if (isDuplicate) return prev;
        return [toastItem, ...prev.slice(0, 2)];
      });

      // auto dismiss: 35s for long alarms (matching alarm duration), 10s for customer alarms, 6s for silent updates
      const timeoutMs = isLongAlarm ? 35000 : isAlarm ? 10000 : 6000;
      setTimeout(() => {
        dismissToast(toastId);
      }, timeoutMs);

      // 3. immediately synchronize tanstack query cache
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['riders'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });

      if (data.order_id) {
        queryClient.invalidateQueries({ queryKey: ['orders', 'status', data.order_id] });
      }
    },
    [userId, role, queryClient, dismissToast]
  );

  // stabilize zone IDs to prevent effect re-runs on render
  const zoneIdsKey = React.useMemo(() => {
    if (!Array.isArray(rider?.assigned_zones)) return '';
    return rider.assigned_zones
      .map((z: any) => (typeof z === 'string' ? z : z?._id || z?.id || ''))
      .filter(Boolean)
      .sort()
      .join(',');
  }, [rider?.assigned_zones]);

  // subscribe to pusher channels based on user role and context
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher || !isAuthenticated || !userId) return;

    const subscribedChannels: string[] = [];

    const subscribeToChannel = (channelName: string) => {
      if (subscribedChannels.includes(channelName)) return;
      subscribedChannels.push(channelName);

      const channel = pusher.subscribe(channelName);

      // bind to generic notification event
      channel.bind('notification:received', handleIncomingNotification);

      // bind to specific order events
      channel.bind('order:new', handleIncomingNotification);
      channel.bind('order:available', handleIncomingNotification);
      channel.bind('order:rider_assigned', handleIncomingNotification);
      channel.bind('order:preparing', handleIncomingNotification);
      channel.bind('order:food_ready', handleIncomingNotification);
      channel.bind('order:picked_up', handleIncomingNotification);
      channel.bind('order:delivered', handleIncomingNotification);
      channel.bind('order:cancelled', handleIncomingNotification);
      channel.bind('order:claimed', () => {
        // silently remove from radar
        queryClient.invalidateQueries({ queryKey: ['riders', 'available-orders'] });
      });
    };

    // 1. Customer / generic user channel
    subscribeToChannel(`customer-${userId}`);

    // 2. Restaurant channel
    if (isRestaurantOwner && restaurantId) {
      subscribeToChannel(`restaurant-${restaurantId}`);
    }

    // 3. Rider channel & zone radar channels
    if (isRider) {
      if (riderId) {
        subscribeToChannel(`rider-${riderId}`);
      }
      subscribeToChannel(`rider-user-${userId}`);

      if (zoneIdsKey) {
        zoneIdsKey.split(',').forEach((zId) => {
          if (zId) {
            subscribeToChannel(`zone-${zId}`);
          }
        });
      }
    }

    return () => {
      stopActiveAlarm();
      subscribedChannels.forEach((ch) => {
        const channel = pusher.channel(ch);
        if (channel) {
          channel.unbind_all();
          pusher.unsubscribe(ch);
        }
      });
    };
  }, [
    isAuthenticated,
    userId,
    isRestaurantOwner,
    restaurantId,
    isRider,
    riderId,
    zoneIdsKey,
    handleIncomingNotification,
    queryClient,
  ]);

  const getToastIcon = (item: ToastNotification) => {
    switch (item.type) {
      case 'ORDER_NEW':
        return <Utensils className="w-5 h-5 text-rose-600" />;
      case 'ORDER_AVAILABLE':
        return <Bike className="w-5 h-5 text-indigo-600" />;
      case 'FOOD_READY':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'ORDER_PICKED_UP':
        return <Bike className="w-5 h-5 text-purple-600" />;
      case 'ORDER_DELIVERED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'ORDER_CANCELLED':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <NotificationContext.Provider value={{ activeToasts, dismissToast }}>
      {children}

      {mounted &&
        createPortal(
          <div className="fixed top-4 right-4 z-[110] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2">
            {activeToasts.map((toast) => {
              const isAlarm = toast.priority === 'ALARM';
              return (
                <div
                  key={toast.toastId}
                  className={`pointer-events-auto rounded-3xl p-3.5 shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 flex items-start gap-3 ${
                    isAlarm
                      ? 'bg-white/95 border-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-white/95 border-slate-200'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                      isAlarm
                        ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-100 animate-pulse'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    {getToastIcon(toast)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {toast.title}
                      </h4>
                      {isAlarm && (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                          <Volume2 className="w-2.5 h-2.5 text-rose-600 animate-pulse" /> Alarm
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {toast.message}
                    </p>

                    {isAlarm && (
                      <button
                        type="button"
                        onClick={() => dismissToast(toast.toastId)}
                        className="mt-1 px-2.5 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs w-fit"
                      >
                        <VolumeX className="w-3 h-3" />
                        <span>Silence Alarm</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissToast(toast.toastId)}
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </NotificationContext.Provider>
  );
}

