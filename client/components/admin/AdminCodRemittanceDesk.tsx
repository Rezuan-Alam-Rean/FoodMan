// admin cod remittance reconciliation desk with approve/reject actions
'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Banknote,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  useAdminRemittancesQuery,
  useVerifyRemittanceMutation,
} from '@/hooks/queries/use-admin-queries';
import { formatBDT } from '@/lib/utils';

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_VERIFICATION: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export function AdminCodRemittanceDesk() {
  const [filter, setFilter] = useState<'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED' | ''>('PENDING_VERIFICATION');
  const { data: remittances, isLoading, isError, refetch } = useAdminRemittancesQuery(filter || undefined);
  const verifyMutation = useVerifyRemittanceMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleVerify = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    verifyMutation.mutate(
      { remittanceId: id, status, admin_notes: notes[id] || '' },
      { onSettled: () => setProcessingId(null) }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">COD Remittance Desk</h2>
            <p className="text-[11px] text-slate-400 font-medium">reconcile rider cash remittances to admin</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {[
          { value: 'PENDING_VERIFICATION', label: 'Pending' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
        ].map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value as any)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition shrink-0 cursor-pointer ${
              filter === f.value
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">failed to load remittances</p>
          <button type="button" onClick={() => refetch()} className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer">
            Try Again
          </button>
        </div>
      ) : !remittances || (remittances as any[]).length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">no remittances found for this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(remittances as any[]).map((rem: any) => {
            const rider = rem.rider_id;
            const riderUser = rider?.user_id;
            const isProcessing = processingId === rem._id;
            const isPending = rem.status === 'PENDING_VERIFICATION';

            return (
              <div key={rem._id} className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-black text-slate-900">{riderUser?.name || 'Rider'}</p>
                    <p className="text-xs text-slate-500 font-medium">{riderUser?.phone_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-slate-900">{formatBDT(rem.amount)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_STYLES[rem.status] || 'bg-slate-100 text-slate-600'}`}>
                      {rem.status.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Method</span>
                    <span className="font-bold text-slate-900">{rem.payment_method}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Sender Account</span>
                    <span className="font-bold text-slate-900">{rem.sender_account_no}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Transaction Ref</span>
                    <span className="font-black text-slate-900 font-mono">{rem.transaction_reference}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Submitted</span>
                    <span className="font-medium text-slate-700">{formatDate(rem.createdAt)}</span>
                  </div>
                  {rem.admin_notes && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Admin Notes</span>
                      <span className="font-medium text-slate-700">{rem.admin_notes}</span>
                    </div>
                  )}
                </div>

                {isPending && (
                  <>
                    <input
                      type="text"
                      placeholder="Admin notes (optional)"
                      value={notes[rem._id] || ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [rem._id]: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition"
                    />
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleVerify(rem._id, 'APPROVED')}
                        className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleVerify(rem._id, 'REJECTED')}
                        className="flex-1 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
