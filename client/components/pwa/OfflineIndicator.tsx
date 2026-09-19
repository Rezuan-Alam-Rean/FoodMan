'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { WifiOff, RotateCw, CheckCircle2 } from 'lucide-react';

function subscribeOnlineStatus(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function OfflineIndicator() {
  const isOffline = useSyncExternalStore(
    subscribeOnlineStatus,
    () => !navigator.onLine,
    () => false
  );

  const [justReconnected, setJustReconnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleOnline = () => {
      setJustReconnected(true);
      timer = setTimeout(() => {
        setJustReconnected(false);
      }, 3500);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      clearTimeout(timer);
    };
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      window.location.reload();
    } else {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  if (!isOffline && !justReconnected) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] sm:max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      {isOffline ? (
        <div className="flex items-center justify-between gap-3 bg-slate-900/95 dark:bg-slate-950/95 text-white p-3.5 sm:px-4 sm:py-3 rounded-2xl shadow-2xl backdrop-blur-md border border-rose-500/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">You are currently offline</p>
              <p className="text-[11px] text-slate-400 truncate">Connect to internet for live menus & orders</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-60 cursor-pointer"
            title="Refresh connection"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Checking...' : 'Refresh'}</span>
          </button>
        </div>
      ) : justReconnected ? (
        <div className="flex items-center justify-center gap-2 bg-emerald-600/95 text-white py-2.5 px-4 rounded-2xl shadow-xl backdrop-blur-md border border-emerald-400/40 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span className="text-xs font-bold">Back online! Content is updating.</span>
        </div>
      ) : null}
    </div>
  );
}
