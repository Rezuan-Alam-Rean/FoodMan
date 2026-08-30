// mobile-first customer header with FoodMan brand logo
'use client';

import React from 'react';
import Link from 'next/link';
import { UtensilsCrossed } from 'lucide-react';

export function CustomerHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8F9FA]/90 backdrop-blur-md px-4 py-3 transition border-b border-slate-200/50">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-rose-500/25 group-hover:scale-105 transition">
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
      </div>
    </header>
  );
}

