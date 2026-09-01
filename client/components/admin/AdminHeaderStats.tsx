// admin control tower top header status bar with live counters
'use client';

import React from 'react';
import { ShieldCheck, Activity, CreditCard, Banknote } from 'lucide-react';
import { useAdminDeskCountsQuery } from '@/hooks/queries/use-admin-queries';

export function AdminHeaderStats() {
  const { data: counts } = useAdminDeskCountsQuery();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-3xl bg-gradient-to-tr from-slate-900 to-slate-700 text-rose-400 flex items-center justify-center shadow-lg shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 leading-tight">Admin Control Tower</h1>
          <p className="text-xs text-slate-400 font-medium">platform management and financial oversight</p>
        </div>
      </div>

      {counts && (
        <div className="flex items-center gap-2 flex-wrap">
          {counts.active_orders_in_progress > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-50 border border-blue-100">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-black text-blue-700">
                {counts.active_orders_in_progress} live orders
              </span>
            </div>
          )}
          {counts.pending_mfs_verifications > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-violet-50 border border-violet-100">
              <CreditCard className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-black text-violet-700">
                {counts.pending_mfs_verifications} pending MFS
              </span>
            </div>
          )}
          {counts.pending_cod_remittances > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-100">
              <Banknote className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-black text-amber-700">
                {counts.pending_cod_remittances} pending COD
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
