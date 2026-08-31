// dedicated restaurant vendor kitchen layout with route guard
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { UtensilsCrossed, LogOut } from 'lucide-react';

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, logout } = useAuth();

  const role = user?.role;
  const isAuthorized = isAuthenticated && (role === 'RESTAURANT_OWNER' || role === 'ADMIN');

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
      } else {
        router.replace('/');
      }
    }
  }, [isInitialized, isAuthenticated, isAuthorized, role, router]);

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
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

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Restaurant Partner'}</p>
              <p className="text-[10px] text-slate-400 font-medium">{user?.phone_number}</p>
            </div>
            <button
              onClick={() => logout(() => router.push('/auth/login'))}
              className="px-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5"
              title="log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
