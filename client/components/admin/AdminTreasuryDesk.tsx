// admin treasury desk: all partner wallets and payout disbursement history
'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, RefreshCw, Wallet, CreditCard, Bike, Store } from 'lucide-react';
import {
  useAllPartnerWalletsQuery,
  usePayoutHistoryQuery,
} from '@/hooks/queries/use-admin-queries';
import { DisbursePayoutModal } from './DisbursePayoutModal';
import { formatBDT } from '@/lib/utils';

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function AdminTreasuryDesk() {
  const [activeTab, setActiveTab] = useState<'wallets' | 'history'>('wallets');
  const [payoutTarget, setPayoutTarget] = useState<{
    userId: string;
    name: string;
    role: 'RIDER' | 'RESTAURANT_OWNER';
    balance: number;
  } | null>(null);

  const { data: wallets, isLoading: walletsLoading, isError: walletsError, refetch: refetchWallets } = useAllPartnerWalletsQuery();
  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = usePayoutHistoryQuery();

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Treasury & Payouts</h2>
              <p className="text-[11px] text-slate-400 font-medium">partner wallets and disbursement history</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => activeTab === 'wallets' ? refetchWallets() : refetchHistory()}
            className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex rounded-2xl overflow-hidden border border-slate-200">
          {(['wallets', 'history'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-black capitalize transition cursor-pointer ${
                activeTab === tab ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab === 'wallets' ? 'Partner Wallets' : 'Payout History'}
            </button>
          ))}
        </div>

        {activeTab === 'wallets' ? (
          walletsLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 text-emerald-600 animate-spin" /></div>
          ) : walletsError ? (
            <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <button type="button" onClick={() => refetchWallets()} className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer">Try Again</button>
            </div>
          ) : !wallets || (wallets as any[]).length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-400">no partner wallets found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(wallets as any[])
                .filter((w: any) => w.user_id?.role === 'RIDER' || w.user_id?.role === 'RESTAURANT_OWNER')
                .map((wallet: any) => {
                  const user = wallet.user_id;
                  const isRider = user?.role === 'RIDER';
                  const canPayout = Boolean(user?._id) && (wallet.current_balance || 0) > 0;

                  return (
                    <div key={wallet._id} className="bg-white rounded-3xl p-4 border border-slate-200 flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isRider ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isRider ? <Bike className="w-4.5 h-4.5" /> : <Store className="w-4.5 h-4.5" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-black text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{user?.phone_number}</p>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
                          <span>Lifetime: <span className="text-slate-700 font-bold">{formatBDT(wallet.lifetime_earnings || 0)}</span></span>
                          <span>Settled: <span className="text-slate-700 font-bold">{formatBDT(wallet.total_settled_by_admin || 0)}</span></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1.5">
                        <p className={`text-sm font-black ${canPayout ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {formatBDT(wallet.current_balance || 0)}
                        </p>
                        {canPayout && (
                          <button
                            type="button"
                            onClick={() => setPayoutTarget({
                              userId: user._id,
                              name: user.name,
                              role: user.role,
                              balance: wallet.current_balance,
                            })}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            Payout
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )
        ) : (
          historyLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 text-emerald-600 animate-spin" /></div>
          ) : historyError ? (
            <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <button type="button" onClick={() => refetchHistory()} className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer">Try Again</button>
            </div>
          ) : !history || (history as any[]).length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-400">no payout disbursements recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(history as any[]).map((payout: any) => {
                const recipient = payout.recipient_user_id;
                return (
                  <div key={payout._id} className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900">{recipient?.name}</p>
                        <p className="text-[11px] text-slate-500">{recipient?.phone_number} • {recipient?.role}</p>
                      </div>
                      <p className="text-sm font-black text-emerald-600 shrink-0">-{formatBDT(payout.amount)}</p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span>via {payout.payout_channel} • Ref: {payout.reference_txn_id}</span>
                      <span>{formatDate(payout.createdAt)}</span>
                    </div>
                    {payout.notes && (
                      <p className="text-[11px] text-slate-500 italic">{payout.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {payoutTarget && (
        <DisbursePayoutModal
          isOpen={true}
          onClose={() => setPayoutTarget(null)}
          recipientUserId={payoutTarget.userId}
          recipientName={payoutTarget.name}
          recipientRole={payoutTarget.role}
          currentBalance={payoutTarget.balance}
        />
      )}
    </>
  );
}
