// mobile bottom navigation bar component
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

export function BottomNav() {
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
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 grid grid-cols-4 items-center shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
              item.isActive
                ? 'text-rose-600 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {item.badge !== null && item.badge !== undefined && (
                <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

