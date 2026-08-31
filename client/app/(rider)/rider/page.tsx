// delivery rider portal placeholder
'use client';

import React from 'react';
import { Bike } from 'lucide-react';

export default function RiderRadarPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
        <Bike className="w-8 h-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rider Radar</h1>
        <p className="text-xs text-slate-500 max-w-sm">
          Delivery partner order radar, assigned zones, and active trip management.
        </p>
      </div>
    </div>
  );
}
