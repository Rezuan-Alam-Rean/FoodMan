'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WifiOff, RotateCw, UtensilsCrossed, ArrowLeft } from 'lucide-react';

function subscribeOnline(callback: () => void) {
  if (typeof window === 'undefined') return () => { };
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export default function OfflinePage() {
  const router = useRouter();
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    () => true
  );

  const [isChecking, setIsChecking] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // Automatically navigate to home when connection is restored
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isOnline, router]);

  const handleRefresh = () => {
    setIsChecking(true);
    setFeedbackText('Checking connection...');

    setTimeout(() => {
      setIsChecking(false);
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setFeedbackText('Still offline. Please check your Wi-Fi or mobile data.');
      }
    }, 600);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 text-center shadow-xl border border-slate-200 dark:border-slate-800 transition-all">

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
            Food<span className="text-rose-600">Man</span>
          </span>
        </div>


        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 mb-6 border-2 border-rose-100 dark:border-rose-900/50">
          <WifiOff className="w-10 h-10 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
          </span>
        </div>


        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
          You&apos;re Currently Offline
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
          FoodMan needs an active internet connection to browse restaurants, update live menus, and place delivery orders. Please reconnect your device to Wi-Fi or cellular data.
        </p>


        {(feedbackText || isOnline) && (
          <div
            className={`text-xs font-semibold px-3 py-2 rounded-xl mb-4 transition-all ${isOnline
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
          >
            {isOnline ? 'Connection restored! Redirecting to home...' : feedbackText}
          </div>
        )}


        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            disabled={isChecking}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-rose-600/25 transition disabled:opacity-60 cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Reconnecting...' : 'Refresh to Reconnect'}</span>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>


        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Quick troubleshooting:</p>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>Check if your Wi-Fi or mobile data toggle is on</li>
            <li>Turn Airplane mode on and off</li>
            <li>Tap <strong>Refresh to Reconnect</strong> above once you are back online</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
