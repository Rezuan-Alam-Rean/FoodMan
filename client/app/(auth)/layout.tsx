// dedicated authentication layout with redirect if already logged in
'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;

    if (isAuthenticated && user) {
      if (user.role === 'RIDER') {
        router.replace('/rider');
      } else if (user.role === 'RESTAURANT_OWNER') {
        router.replace('/vendor');
      } else if (user.role === 'ADMIN') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }
    }
  }, [isInitialized, isAuthenticated, user, router]);

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900 selection:bg-rose-100">
      <header className="sticky top-0 z-40 w-full bg-[#F8F9FA]/90 backdrop-blur-md px-4 py-3 transition border-b border-slate-200/50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/25 group-hover:scale-105 transition shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-base font-black tracking-tight text-slate-900 leading-none flex items-center">
                Food<span className="text-rose-600">Man</span>
              </span>
              <p className="text-[10px] font-semibold text-slate-400 leading-none">
                Craving Solved, Fast
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 shadow-xs transition hover:bg-slate-50"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col justify-center">
        {children}
      </main>
    </div>
  );
}
