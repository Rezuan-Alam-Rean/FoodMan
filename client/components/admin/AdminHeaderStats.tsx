'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Activity, CreditCard, Banknote } from 'lucide-react';
import { useAdminDeskCountsQuery } from '@/hooks/queries/use-admin-queries';

export function AdminHeaderStats() {
  const { data: counts } = useAdminDeskCountsQuery();

  return (
    <div className="flex flex-col gap-3.5 mb-5">
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
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100/70 transition cursor-pointer active:scale-[0.98] transition-transform shadow-2xs"
            >
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-black text-blue-700">
                {counts.active_orders_in_progress} live orders
              </span>
            </Link>
          )}
          {counts.pending_mfs_verifications > 0 && (
            <Link
              href="/admin/mfs"
              className="flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-2xl bg-violet-50 border border-violet-100 hover:bg-violet-100/70 transition cursor-pointer active:scale-[0.98] transition-transform shadow-2xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-black text-violet-700">
                {counts.pending_mfs_verifications} pending MFS
              </span>
            </Link>
          )}
          {counts.pending_cod_remittances > 0 && (
            <Link
              href="/admin/cod"
              className="flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-100 hover:bg-amber-100/70 transition cursor-pointer active:scale-[0.98] transition-transform shadow-2xs"
            >
              <Banknote className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-black text-amber-700">
                {counts.pending_cod_remittances} pending COD
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
