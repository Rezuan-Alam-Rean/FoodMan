// floating mobile navigation dock with 4 dedicated customer routes
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import {
  Compass,
  ReceiptText,
  ShoppingBag,
  User,
} from 'lucide-react';

export function CustomerBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      href: '/',
      label: 'Explore',
      icon: Compass,
      isActive: pathname === '/' || pathname.startsWith('/restaurants'),
    },
    {
      href: '/orders',
      label: 'Orders',
      icon: ReceiptText,
      isActive: pathname.startsWith('/orders'),
    },
    {
      href: '/cart',
      label: 'Cart',
      icon: ShoppingBag,
      isActive: pathname.startsWith('/cart'),
      badge: mounted && itemCount > 0 ? itemCount : null,
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: User,
      isActive: pathname.startsWith('/profile') || pathname.startsWith('/auth'),
    },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
      <nav className="pointer-events-auto w-full max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-full py-1.5 px-3 grid grid-cols-4 items-center shadow-[0_12px_30px_rgb(0,0,0,0.08)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition group relative ${
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
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

