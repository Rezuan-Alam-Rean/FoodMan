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
  const activeDeliveries =
    profileData?.active_deliveries ||
    (profileData?.active_delivery ? [profileData.active_delivery] : []);
  const activeDeliveryCount = activeDeliveries.length;
  const isOnline = rider?.is_online || false;

  const { data: availableOrders = [] } = useRiderAvailableOrdersQuery(
    isOnline
  );
  const availableOrdersCount = availableOrders.length;

  const navItems = [
    {
      href: '/rider',
      label: 'Radar',
      icon: Radar,
      isActive: pathname === '/rider',
      badge: availableOrdersCount > 0 ? availableOrdersCount : null,
    },
    {
      href: '/rider/trip',
      label: activeDeliveryCount > 1 ? 'Trips' : 'Trip',
      icon: Bike,
      isActive: pathname === '/rider/trip',
      badge: activeDeliveryCount > 0 ? activeDeliveryCount : null,
      dotBadge: false,
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
    <div className="fixed bottom-3 sm:bottom-4 left-0 right-0 z-40 px-3 pointer-events-none flex justify-center pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="pointer-events-auto w-full max-w-md bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-full py-1.5 px-2 grid grid-cols-5 items-center shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center h-12 py-1 rounded-2xl transition-transform duration-150 group relative cursor-pointer active:scale-[0.98] select-none ${
                item.isActive
                  ? 'text-rose-600 font-black'
                  : 'text-slate-400 hover:text-slate-700 font-semibold'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    item.isActive ? 'scale-110 text-rose-600' : 'group-hover:scale-105'
                  }`}
                />
                {item.badge !== null && item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs ring-2 ring-white animate-in zoom-in-50 duration-150">
                    {item.badge}
                  </span>
                )}
                {item.dotBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 leading-none ${item.isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
