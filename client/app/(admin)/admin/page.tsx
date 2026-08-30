// admin control center placeholder
'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AdminControlTowerPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-900 text-rose-500 flex items-center justify-center shadow-xs">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Portal</h1>
        <p className="text-xs text-slate-500 max-w-sm">
          Platform control center and settlements management.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Customer View</span>
      </Link>
    </div>
  );
}
