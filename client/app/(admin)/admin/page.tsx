// admin control center placeholder
'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AdminControlTowerPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-900 text-rose-500 flex items-center justify-center shadow-xs">
        <ShieldCheck className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Tower</h1>
        <p className="text-xs text-slate-500 max-w-sm">
          Platform control center, zone configurations, and settlement disbursements.
        </p>
      </div>
    </div>
  );
}
