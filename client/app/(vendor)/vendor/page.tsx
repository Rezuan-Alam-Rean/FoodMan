// restaurant partner portal placeholder
'use client';

import React from 'react';
import Link from 'next/link';
import { Store, ArrowLeft } from 'lucide-react';

export default function VendorKitchenPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
        <Store className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Restaurant Portal</h1>
        <p className="text-xs text-slate-500 max-w-sm">
          Kitchen desk and vendor management portal.
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
