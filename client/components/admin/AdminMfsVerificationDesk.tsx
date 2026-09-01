// admin mfs payment verification desk with approve/reject actions
'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle, CreditCard, RefreshCw } from 'lucide-react';
import {
  usePendingMfsPaymentsQuery,
  useVerifyMfsPaymentMutation,
} from '@/hooks/queries/use-admin-queries';
import { formatBDT } from '@/lib/utils';

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export function AdminMfsVerificationDesk() {
  const { data: payments, isLoading, isError, refetch } = usePendingMfsPaymentsQuery();
  const verifyMutation = useVerifyMfsPaymentMutation();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const handleVerify = (paymentId: string, status: 'VERIFIED' | 'FAILED') => {
    setProcessingId(paymentId);
    setRowError((prev) => ({ ...prev, [paymentId]: '' }));
    verifyMutation.mutate(
      { paymentId, status, notes: notes[paymentId] || '' },
      {
        onError: (err: any) =>
          setRowError((prev) => ({ ...prev, [paymentId]: err?.message || 'failed to verify payment' })),
        onSettled: () => setProcessingId(null),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">MFS Payment Verification</h2>
            <p className="text-[11px] text-slate-400 font-medium">verify or reject customer manual payments</p>
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

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">failed to load pending payments</p>
          <button type="button" onClick={() => refetch()} className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer">
            Try Again
          </button>
        </div>
      ) : !payments || payments.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">no pending MFS payments — all clear!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(payments as any[]).map((payment: any) => {
            const order = payment.order_id;
            const isProcessing = processingId === payment._id;

            return (
              <div
                key={payment._id}
                className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-black text-slate-900">{order?.order_number || 'Order'}</p>
                    <p className="text-xs font-semibold text-slate-600">
                      {order?.customer_id?.name} • {order?.customer_id?.phone_number}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {order?.restaurant_id?.name} • {order?.delivery_zone_id?.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-black text-slate-900">{formatBDT(payment.amount)}</p>
                    <p className="text-[11px] text-violet-600 font-bold">{payment.method}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Sender Number</span>
                    <span className="font-bold text-slate-900">{payment.sender_number || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Transaction ID</span>
                    <span className="font-black text-slate-900 font-mono">{payment.transaction_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Submitted</span>
                    <span className="font-medium text-slate-700">{formatDate(payment.createdAt)}</span>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Admin notes (optional)"
                  value={notes[payment._id] || ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [payment._id]: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition"
                />

                {rowError[payment._id] && (
                  <p className="text-[11px] text-rose-600 font-semibold">{rowError[payment._id]}</p>
                )}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleVerify(payment._id, 'VERIFIED')}
                    className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Approve Payment</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleVerify(payment._id, 'FAILED')}
                    className="flex-1 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
