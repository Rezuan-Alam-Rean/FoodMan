// read-only rider digital wallet and ledger statement component
'use client';

import React from 'react';
import { useMyWalletQuery } from '@/hooks/queries/use-wallet-queries';
import { useRiderProfileQuery } from '@/hooks/queries/use-rider-queries';
import type { LedgerTransaction } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  Wallet as WalletIcon,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  Loader2,
  Percent,
} from 'lucide-react';

export function RiderWalletCard() {
  const { data, isLoading } = useMyWalletQuery();
  const { data: riderData } = useRiderProfileQuery();

  const wallet = data?.wallet;
  const transactions = data?.transactions || [];
  const commissionRate = riderData?.rider?.commission_rate ?? 10;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-slate-950/20 border border-slate-800/80 space-y-5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-300 text-xs font-bold uppercase tracking-wider">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <WalletIcon className="w-4 h-4 text-rose-400" />
            </div>
            <span>Digital Delivery Wallet</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-[10px] font-black text-slate-300 uppercase tracking-wider border border-slate-700/60">
            Read Only
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Net Receivable Balance</span>
          <p className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1">
            {formatBDT(wallet?.current_balance || 0)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Lifetime</span>
            <p className="font-black text-emerald-400 mt-0.5 truncate text-xs sm:text-sm">
              {formatBDT(wallet?.lifetime_earnings || 0)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Settled</span>
            <p className="font-black text-blue-400 mt-0.5 truncate text-xs sm:text-sm">
              {formatBDT(wallet?.total_settled_by_admin || 0)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Commission</span>
            <p className="font-black text-rose-400 mt-0.5 truncate text-xs sm:text-sm">
              {commissionRate}%
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-800 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
        <p className="leading-relaxed font-medium">
          Earnings are disbursed periodically by Admin Treasury to your registered MFS / Bank account.
          No manual withdrawal requests are needed.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center gap-2.5">
          <Receipt className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Ledger Transaction Statement
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 font-medium">
            No transactions recorded in ledger yet.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {transactions.map((tx: LedgerTransaction) => {
              const txId = tx.id || tx._id;
              const isCredit =
                tx.type === 'CREDIT_DELIVERY_FEE' || tx.type === 'CREDIT_COD_REMITTANCE';

              return (
                <div
                  key={txId}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-slate-50 hover:border-slate-200 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 leading-tight truncate">
                        {tx.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Balance after: {formatBDT(tx.balance_after)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-black text-sm shrink-0 ${
                      isCredit ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isCredit ? `+${formatBDT(tx.amount)}` : `-${formatBDT(tx.amount)}`}
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
