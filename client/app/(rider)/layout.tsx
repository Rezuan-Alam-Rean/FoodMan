// dedicated delivery rider layout with route guard and header availability toggle
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRiderProfileQuery, useToggleRiderStatusMutation } from '@/hooks/queries/use-rider-queries';
import { UtensilsCrossed, Loader2 } from 'lucide-react';
import { RiderBottomNav } from '@/components/rider/RiderBottomNav';

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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-24">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/rider" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/25 group-hover:scale-105 transition shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-base font-black tracking-tight text-slate-900 leading-none flex items-center">
                Food<span className="text-rose-600">Man</span>
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                Rider Portal
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={toggleStatusMutation.isPending}
              onClick={handleToggle}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer shadow-xs ${
                isOnline
                  ? 'bg-emerald-500 text-white shadow-emerald-500/25 ring-2 ring-emerald-200'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={isOnline ? 'tap to go offline' : 'tap to go online'}
            >
              {toggleStatusMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'
                  }`}
                />
              )}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-5">{children}</main>
      <RiderBottomNav />
    </div>
  );
}
