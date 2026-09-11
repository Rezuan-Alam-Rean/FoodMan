// dedicated delivery rider layout with route guard and header availability toggle
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRiderProfileQuery, useToggleRiderStatusMutation } from '@/hooks/queries/use-rider-queries';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { RiderBottomNav } from '@/components/rider/RiderBottomNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { data: profileData } = useRiderProfileQuery(isAuthenticated);
  const toggleStatusMutation = useToggleRiderStatusMutation();

  const role = user?.role;
  const isAuthorized = isAuthenticated && role === 'RIDER';
  const isOnline = profileData?.rider?.is_online || false;

  const handleToggle = () => {
    toggleStatusMutation.mutate(!isOnline);
  };

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (!isAuthorized) {
      if (role === 'CUSTOMER') {
        router.replace('/');
      } else if (role === 'RESTAURANT_OWNER') {
        router.replace('/vendor');
      } else if (role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [isInitialized, isAuthenticated, isAuthorized, role, router]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] sm:pb-36">
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/rider" className="flex items-center gap-2.5 group active:scale-[0.98] transition-transform min-h-[44px] py-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/25 group-hover:scale-105 transition shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-base font-black tracking-tight text-slate-900 leading-none flex items-center">
                Food<span className="text-rose-600">Man</span>
              </span>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider leading-none">
                Rider Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <button
              type="button"
              disabled={toggleStatusMutation.isPending}
              onClick={handleToggle}
              className={`inline-flex items-center justify-center gap-2 min-h-[44px] h-11 px-3.5 sm:px-4 rounded-full text-xs font-black transition-all duration-200 cursor-pointer active:scale-[0.98] disabled:opacity-50 min-w-[94px] ${
                isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 ring-2 ring-emerald-300/70'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs'
              }`}
              title={isOnline ? 'Tap to go offline' : 'Tap to go online'}
            >
              {toggleStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="relative flex h-2.5 w-2.5">
                  {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isOnline ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                </span>
              )}
              <span className="tracking-wide">{isOnline ? 'Online' : 'Offline'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">{children}</main>
      <RiderBottomNav />
    </div>
  );
}
