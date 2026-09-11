// unified reconciliation desk combining mfs payments and cod cash remittances
'use client';

import React, { useState } from 'react';
import { CreditCard, Banknote } from 'lucide-react';
import { AdminMfsVerificationDesk } from './AdminMfsVerificationDesk';
import { AdminCodRemittanceDesk } from './AdminCodRemittanceDesk';
import { useAdminDeskCountsQuery } from '@/hooks/queries/use-admin-queries';

interface AdminReconciliationDeskProps {
  initialTab?: 'mfs' | 'cod';
}

export function AdminReconciliationDesk({ initialTab = 'mfs' }: AdminReconciliationDeskProps) {
  const [activeTab, setActiveTab] = useState<'mfs' | 'cod'>(initialTab);
  const { data: counts } = useAdminDeskCountsQuery();

  const mfsPending = counts?.pending_mfs_verifications || 0;
  const codPending = counts?.pending_cod_remittances || 0;

  return (
    <div className="space-y-5 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
      <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('mfs')}
          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
            activeTab === 'mfs'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 shrink-0" />
          <span>MFS Payments</span>
          {mfsPending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-600 text-white shadow-xs">
              {mfsPending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cod')}
          className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
            activeTab === 'cod'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Banknote className="w-4 h-4 shrink-0" />
          <span>COD Cash Remittances</span>
          {codPending > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white shadow-xs">
              {codPending}
            </span>
          )}
        </button>
      </div>

      <div>
        {activeTab === 'mfs' ? (
          <AdminMfsVerificationDesk />
        ) : (
          <AdminCodRemittanceDesk />
        )}
      </div>
    </div>
  );
}
