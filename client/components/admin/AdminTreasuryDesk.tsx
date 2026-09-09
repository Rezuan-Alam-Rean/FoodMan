// admin treasury desk: platform cashflow, net profit overview, partner wallets and payout history
'use client';

import React, { useState } from 'react';
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Wallet,
  CreditCard,
  Bike,
  Store,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  Receipt,
  Scale,
  DollarSign,
} from 'lucide-react';
import {
  useAllPartnerWalletsQuery,
  usePayoutHistoryQuery,
  useAdminTreasurySummaryQuery,
} from '@/hooks/queries/use-admin-queries';
import { DisbursePayoutModal } from './DisbursePayoutModal';
import { WhatsAppPhoneLink } from '@/components/ui/WhatsAppPhoneLink';
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

  const { data: treasurySummary, isLoading: summaryLoading, refetch: refetchSummary } =
    useAdminTreasurySummaryQuery();
  const { data: wallets, isLoading: walletsLoading, isError: walletsError, refetch: refetchWallets } =
    useAllPartnerWalletsQuery();
  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } =
    usePayoutHistoryQuery();

  const handleRefreshAll = () => {
    refetchSummary();
    if (activeTab === 'wallets') refetchWallets();
    else refetchHistory();
  };

  const cashflow = treasurySummary?.cashflow;
  const profit = treasurySummary?.profit;
  const metrics = treasurySummary?.metrics;

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Treasury & Finance</h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Cashflow in/out, platform profit, and partner payouts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition cursor-pointer"
            title="Refresh treasury data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Platform Net Profit Hero Card */}
        <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 text-white shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <PiggyBank className="w-3.5 h-3.5" />
                <span>FoodMan Net Profit (মোট লাভ)</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white">
                {summaryLoading ? '...' : formatBDT(profit?.platform_net_profit || 0)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total retained earnings after all commissions and platform fees
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-xs">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                Restaurant Comm.
              </span>
              <p className="text-xs font-black text-emerald-400">
                {summaryLoading ? '...' : formatBDT(profit?.vendor_commission_earned || 0)}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                Rider Comm.
              </span>
              <p className="text-xs font-black text-blue-400">
                {summaryLoading ? '...' : formatBDT(profit?.rider_commission_earned || 0)}
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                Service Fees
              </span>
              <p className="text-xs font-black text-rose-400">
                {summaryLoading ? '...' : formatBDT(profit?.service_fees_collected || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Cash Inflow vs Outflow Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Total Inflow (আসলো)</span>
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-600 block">
              {summaryLoading ? '...' : formatBDT(cashflow?.total_inflow || 0)}
            </span>
            <span className="text-[10px] text-slate-400 block">From customer sales</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Total Outflow (বের হলো)</span>
            </span>
            <span className="text-sm sm:text-base font-black text-rose-600 block">
              {summaryLoading ? '...' : formatBDT(cashflow?.total_outflow || 0)}
            </span>
            <span className="text-[10px] text-slate-400 block">Disbursed to partners</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Landmark className="w-3.5 h-3.5 text-indigo-600" />
              <span>Net Cash Reserve</span>
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900 block">
              {summaryLoading ? '...' : formatBDT(cashflow?.net_cash_reserve || 0)}
            </span>
            <span className="text-[10px] text-slate-400 block">Inflow minus outflow</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-amber-600" />
              <span>Unsettled Liability</span>
            </span>
            <span className="text-sm sm:text-base font-black text-amber-600 block">
              {summaryLoading ? '...' : formatBDT(cashflow?.pending_payable_liability || 0)}
            </span>
            <span className="text-[10px] text-slate-400 block">In partner wallets</span>
          </div>
        </div>

        {/* Partner Wallet Balances Breakdown (All Restaurants & All Riders) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border border-amber-200/80 shadow-xs space-y-1.5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-600" />
                  <span>All Restaurants Money (রেস্টুরেন্ট পাবে)</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  Admin Will Pay
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-black text-amber-700 font-mono">
                  {summaryLoading ? '...' : formatBDT(cashflow?.total_vendor_balance || 0)}
                </span>
                {metrics?.total_vendor_wallets_count !== undefined && (
                  <span className="text-[10px] font-bold text-amber-800/80 bg-amber-100/70 px-2 py-0.5 rounded-md">
                    {metrics.total_vendor_wallets_count} {metrics.total_vendor_wallets_count === 1 ? 'kitchen' : 'kitchens'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Total food sales balance FoodMan will disburse to restaurant partners
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Store className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 border border-blue-200/80 shadow-xs space-y-1.5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-blue-600" />
                  <span>All Riders Money (রাইডার দিবে)</span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  Riders Will Pay
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-black text-blue-700 font-mono">
                  {summaryLoading ? '...' : formatBDT(cashflow?.total_rider_balance || 0)}
                </span>
                {metrics?.total_rider_wallets_count !== undefined && (
                  <span className="text-[10px] font-bold text-blue-800/80 bg-blue-100/70 px-2 py-0.5 rounded-md">
                    {metrics.total_rider_wallets_count} {metrics.total_rider_wallets_count === 1 ? 'courier' : 'couriers'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Total COD cash collected by all riders that they must remit to FoodMan
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Bike className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab switcher */}
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
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
            </div>
          ) : walletsError ? (
            <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <button
                type="button"
                onClick={() => refetchWallets()}
                className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : !wallets || (wallets as any[]).length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
              <p className="text-xs font-semibold text-slate-400">No partner wallets found</p>
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
                    <div
                      key={wallet._id}
                      className="bg-white rounded-3xl p-4 border border-slate-200 flex items-center gap-3.5 shadow-xs"
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isRider ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isRider ? <Bike className="w-4.5 h-4.5" /> : <Store className="w-4.5 h-4.5" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs font-black text-slate-900 truncate">{user?.name}</p>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {user?.phone_number ? (
                            <WhatsAppPhoneLink phone={user.phone_number} />
                          ) : (
                            <span className="text-slate-400">no phone</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 pt-0.5">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              isRider ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isRider ? 'RIDER' : 'RESTAURANT'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Lifetime: {formatBDT(wallet.lifetime_earnings || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1.5">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">
                            Balance
                          </span>
                          <span
                            className={`text-sm font-black ${
                              (wallet.current_balance || 0) > 0 ? 'text-emerald-600' : 'text-slate-500'
                            }`}
                          >
                            {formatBDT(wallet.current_balance || 0)}
                          </span>
                        </div>

                        {canPayout && (
                          <button
                            type="button"
                            onClick={() =>
                              setPayoutTarget({
                                userId: user._id,
                                name: user.name,
                                role: user.role,
                                balance: wallet.current_balance,
                              })
                            }
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Payout</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )
        ) : historyLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
          </div>
        ) : historyError ? (
          <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <button
              type="button"
              onClick={() => refetchHistory()}
              className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : !history || (history as any[]).length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
            <p className="text-xs font-semibold text-slate-400">no payout settlements yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(history as any[]).map((p: any) => {
              const recipient = p.recipient_user_id;
              const isRider = recipient?.role === 'RIDER';

              return (
                <div key={p._id} className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isRider ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {isRider ? <Bike className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{recipient?.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {p.payout_channel} • {p.reference_txn_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-rose-600 block">-{formatBDT(p.amount)}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(p.createdAt)}</span>
                    </div>
                  </div>
                  {p.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      {p.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {payoutTarget && (
        <DisbursePayoutModal
          isOpen={Boolean(payoutTarget)}
          recipientUserId={payoutTarget.userId}
          recipientName={payoutTarget.name}
          recipientRole={payoutTarget.role}
          currentBalance={payoutTarget.balance}
          onClose={() => {
            setPayoutTarget(null);
            refetchWallets();
            refetchHistory();
            refetchSummary();
          }}
        />
      )}
    </>
  );
}
