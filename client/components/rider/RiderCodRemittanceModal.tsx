// rider cod cash collection and remittance management module
'use client';

import React, { useState } from 'react';
import {
  useMyRemittancesQuery,
  useSubmitRemittanceMutation,
} from '@/hooks/queries/use-remittance-queries';
import type { Rider, Wallet, RiderRemittance } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  Banknote,
  Send,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface RiderCodRemittanceModalProps {
  rider: Rider;
  wallet?: Wallet | null;
}

export function RiderCodRemittanceModal({
  rider,
  wallet,
}: RiderCodRemittanceModalProps) {
  const { data: remittances = [], isLoading: isHistoryLoading } = useMyRemittancesQuery();
  const submitRemittanceMutation = useSubmitRemittanceMutation();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BKASH');
  const [senderAccount, setSenderAccount] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const cashLiability =
    wallet?.current_balance !== undefined && wallet.current_balance < 0
      ? Math.abs(wallet.current_balance)
      : 0;

  const cashLimit = Number(rider.cash_in_hand_limit) || 3000;
  const progressPercent = Math.min(Math.round((cashLiability / cashLimit) * 100), 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFeedback({ type: 'error', message: 'please enter a valid positive remittance amount' });
      return;
    }

    if (!senderAccount.trim()) {
      setFeedback({ type: 'error', message: 'sender account or phone number is required' });
      return;
    }

    if (!txnRef.trim()) {
      setFeedback({ type: 'error', message: 'transaction ID or deposit reference is required' });
      return;
    }

    submitRemittanceMutation.mutate(
      {
        amount: numericAmount,
        payment_method: paymentMethod,
        sender_account_no: senderAccount.trim(),
        transaction_reference: txnRef.trim(),
      },
      {
        onSuccess: () => {
          setAmount('');
          setSenderAccount('');
          setTxnRef('');
          setFeedback({
            type: 'success',
            message: 'remittance claim submitted. admin will verify and clear liability shortly.',
          });
        },
        onError: (err: any) => {
          setFeedback({
            type: 'error',
            message: err.message || 'failed to submit remittance claim',
          });
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400">Cash Liability</h3>
              <p className="text-base font-black text-slate-900">{formatBDT(cashLiability)}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Limit: {formatBDT(cashLimit)}
          </span>
        </div>

        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent > 80 ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            {progressPercent}% of cash holding threshold used
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">Remit Cash to Admin</h3>
            <p className="text-[11px] text-slate-400">Submit deposit proof to clear cash holding</p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Remittance Amount (BDT) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 610"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Payment Channel *
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden appearance-none pr-8 font-semibold cursor-pointer"
                >
                  <option value="BKASH">bKash Central Merchant</option>
                  <option value="NAGAD">Nagad Central Merchant</option>
                  <option value="ROCKET">Rocket Merchant</option>
                  <option value="BANK_TRANSFER">Bank BEFTN / Transfer</option>
                  <option value="CASH_DESK">In-Person Cash Desk</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Sender Number / Account *
              </label>
              <input
                type="text"
                required
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Transaction ID / Reference *
              </label>
              <input
                type="text"
                required
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="e.g. 9J3K8DF3"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:border-rose-500 font-semibold uppercase"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitRemittanceMutation.isPending}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20 disabled:opacity-50"
          >
            {submitRemittanceMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Remittance for Approval</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Remittance Submission History
          </h3>
        </div>

        {isHistoryLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-rose-600 animate-spin" />
          </div>
        ) : remittances.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4 font-medium">
            No remittance claims submitted yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {remittances.map((rem: RiderRemittance) => {
              const remId = rem.id || rem._id;
              const isApproved = rem.status === 'APPROVED';
              const isPending = rem.status === 'PENDING_VERIFICATION';

              return (
                <div
                  key={remId}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-black text-slate-900">{formatBDT(rem.amount)}</p>
                    <p className="text-[10px] text-slate-400">
                      {rem.payment_method} • Ref: {rem.transaction_reference}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : isPending
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : isPending ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {isApproved ? 'Cleared' : isPending ? 'Pending' : 'Rejected'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
