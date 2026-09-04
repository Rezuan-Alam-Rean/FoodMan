// interactive notification bell with unread badge counter and floating modal
'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/hooks/queries/use-notification-queries';
import { useAuth } from '@/hooks/use-auth';
import type { NotificationItem } from '@/types';
import { stopActiveAlarm } from '@/lib/audio-chime';
import {
  Bell,
  X,
  CheckCheck,
  Utensils,
  Bike,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Volume2,
  Loader2,
} from 'lucide-react';

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ALARM'>('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  // prevent body scrolling when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const { data: unreadCount = 0 } = useUnreadNotificationCountQuery(isAuthenticated);
  const { data: notificationsData, isLoading } = useNotificationsQuery(
    {
      limit: 30,
      priority: activeFilter === 'ALARM' ? 'ALARM' : '',
    },
    isAuthenticated && isOpen
  );

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const notifications = notificationsData?.notifications || [];

  const handleNotificationClick = (item: NotificationItem) => {
    stopActiveAlarm();
    if (!item.is_read) {
      markReadMutation.mutate(item.id || item._id);
    }
  };

  const getNotificationIcon = (item: NotificationItem) => {
    switch (item.type) {
      case 'ORDER_NEW':
        return <Utensils className="w-4 h-4 text-rose-600" />;
      case 'ORDER_AVAILABLE':
        return <Bike className="w-4 h-4 text-indigo-600" />;
      case 'RIDER_ASSIGNED':
        return <Bike className="w-4 h-4 text-blue-600" />;
      case 'ORDER_PREPARING':
        return <Utensils className="w-4 h-4 text-amber-600" />;
      case 'FOOD_READY':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'ORDER_PICKED_UP':
        return <Bike className="w-4 h-4 text-purple-600" />;
      case 'ORDER_DELIVERED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'ORDER_CANCELLED':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const now = Date.now();
      const diffSec = Math.floor((now - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          stopActiveAlarm();
          setIsOpen(true);
        }}
        className="relative p-2 rounded-2xl bg-white/80 hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition cursor-pointer shadow-xs focus:outline-none"
        title="View notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white shadow-xs">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative">{unreadCount > 99 ? '99+' : unreadCount}</span>
          </span>
        )}
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[120] overflow-y-auto flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsOpen(false)}
            />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden z-10 animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-slate-900">Notifications</h2>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Order status updates & alarms
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-white">
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                      activeFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('ALARM')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer text-[11px] flex items-center gap-1 ${
                      activeFilter === 'ALARM'
                        ? 'bg-white text-rose-600 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Volume2 className="w-3 h-3 text-rose-500" />
                    <span>Alarms</span>
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    disabled={markAllReadMutation.isPending}
                    onClick={() => {
                      stopActiveAlarm();
                      markAllReadMutation.mutate();
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
                {isLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
                    <span className="text-xs font-medium">Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-16 px-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Bell className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">All caught up!</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {activeFilter === 'ALARM'
                          ? 'No high-priority alarm notifications right now.'
                          : 'No notifications at the moment.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isAlarm = item.priority === 'ALARM';
                    return (
                      <div
                        key={item.id || item._id}
                        onClick={() => handleNotificationClick(item)}
                        className={`p-3 rounded-2xl flex items-start gap-3 transition border ${
                          !item.is_read
                            ? isAlarm
                              ? 'bg-rose-50/40 border-rose-200/80 shadow-xs'
                              : 'bg-slate-50/80 border-slate-200/80'
                            : 'bg-white border-slate-100'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isAlarm
                              ? 'bg-rose-100/70 border-rose-200'
                              : 'bg-slate-100 border-slate-200/60'
                          }`}
                        >
                          {getNotificationIcon(item)}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className={`text-xs truncate ${
                                  !item.is_read
                                    ? 'font-black text-slate-900'
                                    : 'font-bold text-slate-700'
                                }`}
                              >
                                {item.title}
                              </span>
                              {isAlarm && (
                                <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[9px] font-black uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                                  <Volume2 className="w-2.5 h-2.5 text-rose-600" /> Alarm
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-snug">
                            {item.message}
                          </p>
                        </div>

                        {!item.is_read && (
                          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-1.5" title="Unread" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
