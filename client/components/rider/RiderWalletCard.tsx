// read-only rider digital wallet and ledger statement component
'use client';

import React from 'react';
import { useMyWalletQuery } from '@/hooks/queries/use-wallet-queries';
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
} from 'lucide-react';

export function RiderWalletCard() {
  const { data, isLoading } = useMyWalletQuery();
  const wallet = data?.wallet;
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase tracking-wider">
            <WalletIcon className="w-4 h-4 text-rose-500" />
            <span>Digital Delivery Wallet</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-700/80 text-[10px] font-bold text-slate-300 uppercase">
            Read Only
          </span>
        </div>

        <div>
          <span className="text-xs text-slate-400 font-medium">Net Receivable Balance</span>
          <p className="text-3xl font-black tracking-tight text-white mt-0.5">
            {formatBDT(wallet?.current_balance || 0)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Lifetime Earnings</span>
            <p className="font-black text-slate-100 mt-0.5">
              {formatBDT(wallet?.lifetime_earnings || 0)}
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold">Total Settled</span>
            <p className="font-black text-slate-100 mt-0.5">
              {formatBDT(wallet?.total_settled_by_admin || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-100 text-rose-800 text-xs flex items-start gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
        <p className="leading-snug">
          Earnings are disbursed periodically by Admin Treasury to your registered MFS/Bank account.
          No manual withdrawal requests are required.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Ledger Transaction Statement
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-rose-600 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4 font-medium">
            No transactions recorded yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {transactions.map((tx: LedgerTransaction) => {
              const txId = tx.id || tx._id;
              const isCredit =
                tx.type === 'CREDIT_DELIVERY_FEE' || tx.type === 'CREDIT_COD_REMITTANCE';

              return (
                <div
                  key={txId}
                  className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                        isCredit
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 leading-tight">
                        {tx.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Balance after: {formatBDT(tx.balance_after)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-black ${
                      isCredit ? 'text-emerald-600' : 'text-slate-800'
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
