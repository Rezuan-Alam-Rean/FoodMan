// rider cod cash collection and remittance management module
'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Check,
} from 'lucide-react';

const PAYMENT_CHANNELS = [
  {
    id: 'BKASH',
    label: 'bKash Central Merchant',
    sublabel: 'Official merchant account • Instant',
    badge: 'bKash',
    badgeClass: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  {
    id: 'NAGAD',
    label: 'Nagad Central Merchant',
    sublabel: 'Official merchant account • Fast deposit',
    badge: 'Nagad',
    badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    id: 'ROCKET',
    label: 'Rocket Merchant',
    sublabel: 'DBBL Rocket gateway reference',
    badge: 'Rocket',
    badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Bank BEFTN / Transfer',
    sublabel: 'Corporate bank deposit / Online EFT',
    badge: 'Bank EFT',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    id: 'CASH_DESK',
    label: 'In-Person Cash Desk',
    sublabel: 'FoodMan central hub cash deposit',
    badge: 'Cash Desk',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
];

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [senderAccount, setSenderAccount] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const selectedChannel =
    PAYMENT_CHANNELS.find((c) => c.id === paymentMethod) || PAYMENT_CHANNELS[0];

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
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Cash Liability</h3>
              <p className="text-lg sm:text-xl font-black text-slate-900">{formatBDT(cashLiability)}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-500 border border-slate-200/60">
            Limit: {formatBDT(cashLimit)}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent > 80 ? 'bg-rose-500' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-semibold">
            {progressPercent}% of cash holding threshold used
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">Remit Cash to Admin</h3>
            <p className="text-xs text-slate-400 font-medium">Submit deposit proof to clear cash holding liability</p>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 animate-in shake duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
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
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-base sm:text-sm text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-semibold shadow-2xs"
              />
            </div>

            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                Payment Channel *
              </label>
              <input type="hidden" name="payment_method" value={paymentMethod} />
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`w-full h-12 px-3.5 sm:px-4 rounded-2xl border transition-all duration-150 bg-white flex items-center justify-between shadow-2xs cursor-pointer active:scale-[0.99] text-left ${
                  isDropdownOpen
                    ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0 ${selectedChannel.badgeClass}`}
                  >
                    {selectedChannel.badge}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                    {selectedChannel.label}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
                    isDropdownOpen ? 'rotate-180 text-rose-600' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto"
                >
                  {PAYMENT_CHANNELS.map((channel) => {
                    const isSelected = channel.id === paymentMethod;

                    return (
                      <button
                        key={channel.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setPaymentMethod(channel.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 sm:p-3 rounded-xl transition-all duration-150 flex items-center justify-between gap-3 text-left cursor-pointer active:scale-[0.99] ${
                          isSelected
                            ? 'bg-rose-50/80 border border-rose-200 shadow-2xs'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0 ${channel.badgeClass}`}
                          >
                            {channel.badge}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-xs sm:text-sm leading-tight truncate ${
                                isSelected ? 'font-black text-rose-700' : 'font-black text-slate-800'
                              }`}
                            >
                              {channel.label}
                            </p>
                            <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5 truncate">
                              {channel.sublabel}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                Sender Number / Account *
              </label>
              <input
                type="text"
                required
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-base sm:text-sm text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-semibold shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                Transaction ID / Reference *
              </label>
              <input
                type="text"
                required
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="e.g. 9J3K8DF3"
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 bg-white text-base sm:text-sm text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-semibold uppercase tracking-wider shadow-2xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitRemittanceMutation.isPending}
            className="w-full h-12 sm:h-12.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 active:scale-[0.98] cursor-pointer disabled:opacity-50 select-none"
          >
            {submitRemittanceMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Remittance for Approval</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Remittance Submission History
          </h3>
        </div>

        {isHistoryLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
          </div>
        ) : remittances.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-5 font-medium">
            No remittance claims submitted yet.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {remittances.map((rem: RiderRemittance) => {
              const remId = rem.id || rem._id;
              const isApproved = rem.status === 'APPROVED';
              const isPending = rem.status === 'PENDING_VERIFICATION';

              return (
                <div
                  key={remId}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3 text-xs hover:border-slate-300 transition"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-black text-slate-900 text-sm truncate">{formatBDT(rem.amount)}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {rem.payment_method} • Ref: {rem.transaction_reference}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1.5 shrink-0 shadow-2xs ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : isPending
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isPending ? (
                      <Clock className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
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
