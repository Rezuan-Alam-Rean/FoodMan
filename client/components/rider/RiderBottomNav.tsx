// floating mobile navigation dock for dedicated rider routes
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRiderProfileQuery, useRiderAvailableOrdersQuery } from '@/hooks/queries/use-rider-queries';
import {
  Radar,
  Bike,
  Banknote,
  Wallet,
  User,
} from 'lucide-react';

export function RiderBottomNav() {
  const pathname = usePathname();
  const { data: profileData } = useRiderProfileQuery();

  const rider = profileData?.rider;
  const activeDelivery = profileData?.active_delivery;
  const hasActiveTrip = Boolean(activeDelivery);
  const isOnline = rider?.is_online || false;

  const { data: availableOrders = [] } = useRiderAvailableOrdersQuery(
    isOnline && !hasActiveTrip
  );
  const availableOrdersCount = availableOrders.length;

  const navItems = [
    {
      href: '/rider',
      label: 'Radar',
      icon: Radar,
      isActive: pathname === '/rider',
      badge: availableOrdersCount > 0 && !hasActiveTrip ? availableOrdersCount : null,
    },
    {
      href: '/rider/trip',
      label: 'Trip',
      icon: Bike,
      isActive: pathname === '/rider/trip',
      dotBadge: hasActiveTrip,
    },
    {
      href: '/rider/cash',
      label: 'Cash',
      icon: Banknote,
      isActive: pathname === '/rider/cash',
    },
    {
      href: '/rider/earnings',
      label: 'Earnings',
      icon: Wallet,
      isActive: pathname === '/rider/earnings',
    },
    {
      href: '/rider/profile',
      label: 'Profile',
      icon: User,
      isActive: pathname === '/rider/profile',
    },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-full py-1.5 px-2.5 sm:px-3 grid grid-cols-5 items-center shadow-[0_12px_30px_rgb(0,0,0,0.08)]">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition group relative cursor-pointer ${
                item.isActive
                  ? 'text-rose-600 font-extrabold'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition transform ${
                    item.isActive ? 'scale-110 text-rose-600' : 'group-hover:scale-105'
                  }`}
                />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
                {item.dotBadge && (
                  <span className="absolute -top-0.5 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
