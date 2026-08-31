// global not found page for handling undefined routes
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowLeft,
  Home,
  UtensilsCrossed,
  Bike,
  Store,
  ShieldCheck,
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-lg text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="relative inline-block">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-600/10">
            <Compass className="w-12 h-12 sm:w-14 sm:h-14 animate-spin [animation-duration:12s]" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black tracking-wider uppercase shadow-md">
            404
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Page Off The Menu!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed font-medium">
            We couldn’t find the page or meal you were looking for. It might have been moved, deleted, or delivered elsewhere.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-extrabold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Quick Navigation
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-200 text-slate-600 dark:text-slate-300 font-bold transition flex items-center gap-1.5"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-rose-500" />
              <span>Explore Food</span>
            </Link>

            <Link
              href="/rider"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-200 text-slate-600 dark:text-slate-300 font-bold transition flex items-center gap-1.5"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-500" />
              <span>Rider Portal</span>
            </Link>

            <Link
              href="/vendor"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-200 text-slate-600 dark:text-slate-300 font-bold transition flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-amber-500" />
              <span>Restaurant Panel</span>
            </Link>

            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-200 text-slate-600 dark:text-slate-300 font-bold transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
