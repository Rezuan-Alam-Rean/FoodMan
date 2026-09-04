// dedicated restaurant vendor kitchen layout with route guard and persistent floating dock
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  useMyRestaurantQuery,
  useToggleRestaurantStatusMutation,
} from '@/hooks/queries/use-restaurant-queries';
import { VendorBottomNav } from '@/components/vendor/VendorBottomNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { UtensilsCrossed, Power, Loader2 } from 'lucide-react';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { data: restaurant } = useMyRestaurantQuery(isAuthenticated);
  const toggleStatusMutation = useToggleRestaurantStatusMutation();

  const role = user?.role;
  const isAuthorized = isAuthenticated && role === 'RESTAURANT_OWNER';

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (!isAuthorized) {
      if (role === 'CUSTOMER') {
        router.replace('/');
      } else if (role === 'RIDER') {
        router.replace('/rider');
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

  const isOpen = restaurant?.is_open ?? true;
  const restaurantId = restaurant?.id || restaurant?._id;

  const handleToggleStoreStatus = () => {
    if (!restaurantId) return;
    toggleStatusMutation.mutate({
      restaurantId,
      is_open: !isOpen,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/vendor" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/25 group-hover:scale-105 transition shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-base font-black tracking-tight text-slate-900 leading-none flex items-center">
                Food<span className="text-rose-600">Man</span>
              </span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                Restaurant Panel
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2.5">
            <NotificationBell />
            {restaurant && (
              <button
                type="button"
                disabled={toggleStatusMutation.isPending}
                onClick={handleToggleStoreStatus}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  isOpen
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
                title="toggle store open or closed"
              >
                {toggleStatusMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOpen ? 'bg-white animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                )}
                <span>{isOpen ? 'Store Open' : 'Store Closed'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-4 pb-28 sm:pb-24">
        {children}
      </main>

      <VendorBottomNav />
    </div>
  );
}
