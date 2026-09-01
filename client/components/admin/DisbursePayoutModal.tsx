// disburse manual payout modal for riders and restaurants
'use client';

import React, { useState } from 'react';
import { X, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useDisbursePayoutMutation } from '@/hooks/queries/use-admin-queries';
import { formatBDT } from '@/lib/utils';

interface DisbursePayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUserId: string;
  recipientName: string;
  recipientRole: 'RIDER' | 'RESTAURANT_OWNER';
  currentBalance: number;
}

const PAYOUT_CHANNELS = [
  { value: 'BKASH_DISBURSEMENT', label: 'bKash Disbursement' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
];

export function DisbursePayoutModal({
  isOpen,
  onClose,
  recipientUserId,
  recipientName,
  recipientRole,
  currentBalance,
}: DisbursePayoutModalProps) {
  const [amount, setAmount] = useState('');
  const [channel, setChannel] = useState('BKASH_DISBURSEMENT');
  const [refTxnId, setRefTxnId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const disburseMutation = useDisbursePayoutMutation();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('please enter a valid payout amount');
      return;
    }
    if (parsedAmount > currentBalance) {
      setError(`amount exceeds available wallet balance of ${formatBDT(currentBalance)}`);
      return;
    }
    if (!refTxnId.trim()) {
      setError('reference transaction id is required');
      return;
    }

    disburseMutation.mutate(
      {
        recipient_user_id: recipientUserId,
        amount: parsedAmount,
        payout_channel: channel,
        reference_txn_id: refTxnId.trim(),
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            setAmount('');
            setRefTxnId('');
            setNotes('');
            onClose();
          }, 1800);
        },
        onError: (err: any) => {
          setError(err.message || 'failed to disburse payout');
        },
      }
    );
  };

  const roleLabel = recipientRole === 'RIDER' ? 'Rider' : 'Restaurant';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Disburse Payout</h2>
              <p className="text-[11px] text-slate-400 font-medium">{roleLabel}: {recipientName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-100">
          <p className="text-[11px] font-bold text-emerald-700">
            Available Wallet Balance: <span className="font-black">{formatBDT(currentBalance)}</span>
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-7 h-7" />
            </div>
            <p className="text-sm font-black text-slate-900">Payout Disbursed!</p>
            <p className="text-xs text-slate-500">Wallet balance has been updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[70vh]">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Payout Amount (BDT)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="1"
                step="0.01"
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Payout Channel
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PAYOUT_CHANNELS.map((ch) => (
                  <button
                    key={ch.value}
                    type="button"
                    onClick={() => setChannel(ch.value)}
                    className={`py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                      channel === ch.value
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'
                    }`}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Reference Transaction ID
              </label>
              <input
                type="text"
                value={refTxnId}
                onChange={(e) => setRefTxnId(e.target.value)}
                placeholder="TXN123456789"
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. weekly settlement for August..."
                rows={2}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={disburseMutation.isPending}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
            >
              {disburseMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span>
                {disburseMutation.isPending ? 'Processing...' : `Disburse ${amount ? formatBDT(Number(amount)) : 'Payout'}`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
