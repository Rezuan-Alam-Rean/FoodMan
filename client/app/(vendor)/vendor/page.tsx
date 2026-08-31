// restaurant partner portal placeholder
'use client';

import React from 'react';
import { Store } from 'lucide-react';

export default function VendorKitchenPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
        <Store className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kitchen Desk</h1>
        <p className="text-xs text-slate-500 max-w-sm">
          Restaurant orders, menu management, and kitchen live queue.
        </p>
      </div>
    </div>
  );
}
