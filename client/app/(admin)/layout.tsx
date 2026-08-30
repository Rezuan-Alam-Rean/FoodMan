// dedicated admin control tower layout
'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ShieldCheck, ArrowLeft, User } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              title="back to customer view"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900 leading-tight">Admin Tower</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Control Center</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 hidden sm:inline">
              {user?.name || 'Administrator'}
            </span>
            <Link
              href="/profile"
              className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 text-xs font-bold"
            >
              <User className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
