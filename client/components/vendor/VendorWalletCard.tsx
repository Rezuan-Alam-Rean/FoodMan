// read-only sales wallet and financial ledger statement for restaurant vendors
'use client';

import React from 'react';
import { useMyWalletQuery } from '@/hooks/queries/use-wallet-queries';
import type { Restaurant, LedgerTransaction } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  Wallet,
  TrendingUp,
  Landmark,
  Percent,
  Clock,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
} from 'lucide-react';

interface VendorWalletCardProps {
  restaurant: Restaurant;
}

export function VendorWalletCard({ restaurant }: VendorWalletCardProps) {
  const { data: walletData, isLoading: isWalletLoading } = useMyWalletQuery();

  const wallet = walletData?.wallet;
  const ledger: LedgerTransaction[] = walletData?.transactions || [];

  const currentBalance = Number(wallet?.current_balance) || 0;
  const lifetimeSales = Number(wallet?.lifetime_earnings) || 0;
  const totalSettled = Number(wallet?.total_settled_by_admin) || 0;
  const commissionRate = restaurant.commission_rate ?? 10;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <Wallet className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900 leading-tight">Sales & Earnings Wallet</h2>
          <p className="text-[11px] text-slate-400 font-medium">Read-only digital treasury ledger</p>
        </div>
      </div>

      {isWalletLoading ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-2.5">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading wallet statement...</p>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Net Payable Balance
                </span>
                <h3 className="text-3xl font-black tracking-tight mt-1 text-white">
                  {formatBDT(currentBalance)}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Landmark className="w-5 h-5" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-white/10">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Lifetime Gross Sales
                </span>
                <p className="text-sm font-black text-emerald-400">{formatBDT(lifetimeSales)}</p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Disbursed
                </span>
                <p className="text-sm font-black text-blue-400">{formatBDT(totalSettled)}</p>
              </div>

              <div className="space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Platform Commission
                </span>
                <p className="text-sm font-black text-rose-400">{commissionRate}%</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-blue-900">
              <p className="font-bold">Automated Admin Payout Model</p>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Restaurant digital wallets are read-only. Payouts and bank/MFS settlements are disbursed
                periodically by Admin Treasury. No manual cash-out request is required.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h4 className="text-sm font-black text-slate-900">Double-Entry Ledger</h4>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {ledger.length} {ledger.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {ledger.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Clock className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  No financial transactions recorded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {ledger.map((tx: LedgerTransaction) => {
                  const isCredit =
                    tx.type === 'CREDIT_FOOD_SALE' || tx.type === 'CREDIT_COD_REMITTANCE';
                  const dateStr = tx.createdAt;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={tx.id || tx._id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs hover:border-slate-200 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isCredit
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900">
                            {tx.type === 'CREDIT_FOOD_SALE'
                              ? 'Food Sale Credited'
                              : tx.type === 'DEBIT_PLATFORM_COMMISSION'
                              ? 'Platform Commission Deducted'
                              : tx.type === 'DEBIT_ADMIN_PAYOUT'
                              ? 'Disbursed Admin Payout'
                              : tx.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-[10px] text-slate-400">{formattedDate}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-black ${
                            isCredit ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                          {formatBDT(tx.amount)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Bal: {formatBDT(tx.balance_after)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
