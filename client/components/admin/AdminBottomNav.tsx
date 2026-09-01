// floating mobile navigation dock for dedicated admin routes
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminDeskCountsQuery } from '@/hooks/queries/use-admin-queries';
import { Users, ShoppingBag, MapPin, BadgeCheck, Wallet } from 'lucide-react';

export function AdminBottomNav() {
  const pathname = usePathname();
  const { data: counts } = useAdminDeskCountsQuery();

  const totalReconcilePending =
    (counts?.pending_mfs_verifications || 0) + (counts?.pending_cod_remittances || 0);

  const navItems = [
    {
      href: '/admin',
      label: 'Users',
      icon: Users,
      isActive: pathname === '/admin' || pathname.startsWith('/admin/users'),
    },
    {
      href: '/admin/orders',
      label: 'Orders',
      icon: ShoppingBag,
      isActive: pathname === '/admin/orders',
      badge:
        counts?.active_orders_in_progress && counts.active_orders_in_progress > 0
          ? counts.active_orders_in_progress
          : null,
    },
    {
      href: '/admin/zones',
      label: 'Zones',
      icon: MapPin,
      isActive: pathname === '/admin/zones',
    },
    {
      href: '/admin/reconciliation',
      label: 'Reconcile',
      icon: BadgeCheck,
      isActive:
        pathname === '/admin/reconciliation' ||
        pathname === '/admin/mfs' ||
        pathname === '/admin/cod',
      badge: totalReconcilePending > 0 ? totalReconcilePending : null,
    },
    {
      href: '/admin/treasury',
      label: 'Treasury',
      icon: Wallet,
      isActive: pathname === '/admin/treasury',
    },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-full py-1.5 px-3 grid grid-cols-5 items-center shadow-[0_12px_30px_rgb(0,0,0,0.08)]">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-2xl transition group relative cursor-pointer ${
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
                    {item.badge > 99 ? '99+' : item.badge}
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
