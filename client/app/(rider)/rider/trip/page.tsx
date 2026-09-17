// active delivery trip execution page on /rider/trip supporting multiple concurrent deliveries
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRiderProfileQuery } from '@/hooks/queries/use-rider-queries';
import { ActiveDeliveryCard } from '@/components/rider/ActiveDeliveryCard';
import type { RiderActiveOrder } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  Radar,
  Loader2,
  Package,
  Plus,
} from 'lucide-react';

export default function RiderTripPage() {
  const { data: profileData, isLoading: isProfileLoading } = useRiderProfileQuery();

  const rider = profileData?.rider;
  const activeDeliveries: RiderActiveOrder[] = useMemo(() => {
    return (
      profileData?.active_deliveries ||
      (profileData?.active_delivery ? [profileData.active_delivery] : [])
    );
  }, [profileData?.active_deliveries, profileData?.active_delivery]);

  // Batch earnings
  const totalBatchEarnings = useMemo(() => {
    return activeDeliveries.reduce((sum, o) => sum + (o.delivery_fee || 0), 0);
  }, [activeDeliveries]);

  if (isProfileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">Loading Active Trips...</p>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
        <p className="text-sm font-bold text-slate-800">Rider profile not found</p>
        <p className="text-xs text-slate-400">Please contact support or sign in again.</p>
      </div>
    );
  }

  if (activeDeliveries.length === 0) {
    return (
      <div className="space-y-5 pb-6">
        <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 text-center space-y-4 shadow-xs animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-black text-slate-900">No Active Deliveries</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              You do not have any delivery tasks in progress right now. Scan the live radar feed to claim available orders.
            </p>
          </div>
          <Link
            href="/rider"
            className="inline-flex items-center justify-center gap-2 min-h-[48px] h-12 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black shadow-md shadow-rose-600/25 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <Radar className="w-4 h-4" />
            <span>Go to Radar Feed</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">
                Active Trips ({activeDeliveries.length})
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              Flexible fulfillment: pick up and deliver in whatever sequence you choose
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/rider"
              className="min-h-[44px] h-11 px-3.5 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-black transition-all duration-150 inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98] transition-transform shadow-2xs"
              title="Claim more orders from radar"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Order</span>
            </Link>

            <span className="inline-flex items-center min-h-[44px] h-11 px-3.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-black whitespace-nowrap shadow-2xs">
              +{formatBDT(totalBatchEarnings)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {activeDeliveries.map((order) => (
          <ActiveDeliveryCard
            key={order.id || order._id}
            order={order}
          />
        ))}
      </div>
    </div>
  );
}
