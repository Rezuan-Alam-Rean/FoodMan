// dedicated delivery rider layout with route guard
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Bike, LogOut } from 'lucide-react';

export default function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized, logout } = useAuth();

  const role = user?.role;
  const isAuthorized = isAuthenticated && (role === 'RIDER' || role === 'ADMIN');

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
        <div className="max-w-2xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-tight">Rider Radar</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delivery Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name || 'Rider Partner'}</p>
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

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-5">{children}</main>
    </div>
  );
}
