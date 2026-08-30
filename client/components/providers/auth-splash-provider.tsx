// global full-screen animated splash and auth resolution provider
'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useMeQuery } from '@/hooks/queries/use-auth-queries';
import { UtensilsCrossed } from 'lucide-react';

export function AuthSplashProvider({ children }: { children: React.ReactNode }) {
  const store = useAuthStore();
  const token = store.token;
  const isInitialized = store.isInitialized;
  const [mounted, setMounted] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // query /auth/me to refresh/validate active session if token exists
  const meQuery = useMeQuery(!!token && isInitialized);

  useEffect(() => {
    setMounted(true);
    // ensure zustand persist finishes hydration
    if (useAuthStore.persist?.hasHydrated?.()) {
      useAuthStore.getState().setInitialized(true);
    } else {
      const unsub = useAuthStore.persist?.onFinishHydration?.(() => {
        useAuthStore.getState().setInitialized(true);
      });
      return () => unsub?.();
    }
  }, []);

  // artificial delay timer for smooth brand UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 850);

    return () => clearTimeout(timer);
  }, []);

  // sync fresh profile when meQuery resolves
  useEffect(() => {
    if (meQuery.data && JSON.stringify(meQuery.data) !== JSON.stringify(store.user)) {
      store.setUser(meQuery.data);
    }
  }, [meQuery.data, store]);

  // if token is invalid or rejected by server (401/403), clear auth
  useEffect(() => {
    if (meQuery.isError && token) {
      const errMessage = ((meQuery.error as any)?.message || '').toLowerCase();
      const isAuthError =
        errMessage.includes('401') ||
        errMessage.includes('403') ||
        errMessage.includes('unauthorized') ||
        errMessage.includes('token') ||
        errMessage.includes('forbidden');
      if (isAuthError) {
        store.clearAuth();
      }
    }
  }, [meQuery.isError, meQuery.error, token, store]);

  // auth state is ready once mounted, hydrated, and profile loaded
  const isAuthReady =
    mounted &&
    isInitialized &&
    (!token || !!store.user || !meQuery.isLoading);

  useEffect(() => {
    if (isAuthReady && minTimeElapsed && !isFadingOut) {
      setIsFadingOut(true);
      const fadeTimer = setTimeout(() => {
        setShowLoader(false);
      }, 350);
      return () => clearTimeout(fadeTimer);
    }
  }, [isAuthReady, minTimeElapsed, isFadingOut]);

  return (
    <>
      {children}
      {showLoader && (
        <div
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 select-none overflow-hidden transition-all duration-350 ease-out ${
            isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
          }`}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center space-y-6 text-center px-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 via-rose-500 to-rose-600 flex items-center justify-center text-white shadow-2xl shadow-rose-500/30 ring-4 ring-rose-500/15 transform transition hover:scale-105">
                <UtensilsCrossed className="w-9 h-9 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-3xl ring-2 ring-rose-400/40 animate-ping pointer-events-none opacity-30" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Food<span className="text-rose-600">Man</span>
              </h1>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                Delicious meals & fast zone delivery
              </p>
            </div>

            <div className="w-36 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full animate-[progress_1.2s_ease-in-out_infinite]" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
