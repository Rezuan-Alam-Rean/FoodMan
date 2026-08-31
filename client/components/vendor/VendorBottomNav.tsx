// floating mobile navigation dock for dedicated restaurant vendor routes
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMyRestaurantQuery } from '@/hooks/queries/use-restaurant-queries';
import { useRestaurantLiveOrdersQuery } from '@/hooks/queries/use-order-queries';
import {
  UtensilsCrossed,
  BookOpen,
  Wallet,
  Store,
} from 'lucide-react';

export function VendorBottomNav() {
  const pathname = usePathname();
  const { data: restaurant } = useMyRestaurantQuery();
  const restaurantId = restaurant?.id || restaurant?._id;

  const { data: liveOrders = [] } = useRestaurantLiveOrdersQuery(
    restaurantId || '',
    Boolean(restaurantId)
  );

  const activeOrdersCount = liveOrders.length;

  const navItems = [
    {
      href: '/vendor',
      label: 'Kitchen',
      icon: UtensilsCrossed,
      isActive: pathname === '/vendor',
      badge: activeOrdersCount > 0 ? activeOrdersCount : null,
    },
    {
      href: '/vendor/menu',
      label: 'Menu',
      icon: BookOpen,
      isActive: pathname === '/vendor/menu',
    },
    {
      href: '/vendor/earnings',
      label: 'Earnings',
      icon: Wallet,
      isActive: pathname === '/vendor/earnings',
    },
    {
      href: '/vendor/profile',
      label: 'Profile',
      icon: Store,
      isActive: pathname === '/vendor/profile',
    },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-full py-1.5 px-3 grid grid-cols-4 items-center shadow-[0_12px_30px_rgb(0,0,0,0.08)]">
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
                  <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {item.badge}
                  </span>
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
