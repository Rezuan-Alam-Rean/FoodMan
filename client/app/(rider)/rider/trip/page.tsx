// active delivery trip execution page on /rider/trip supporting multiple concurrent deliveries
'use client';

import React, { useState, useMemo } from 'react';
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
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const rider = profileData?.rider;
  const activeDeliveries: RiderActiveOrder[] = useMemo(() => {
    return (
      profileData?.active_deliveries ||
      (profileData?.active_delivery ? [profileData.active_delivery] : [])
    );
  }, [profileData?.active_deliveries, profileData?.active_delivery]);

  // Determine currently selected order, falling back to first active delivery
  const currentSelectedOrder = useMemo(() => {
    if (activeDeliveries.length === 0) return null;
    if (selectedOrderId) {
      const found = activeDeliveries.find(
        (o) => (o.id || o._id) === selectedOrderId
      );
      if (found) return found;
    }
    return activeDeliveries[0];
  }, [activeDeliveries, selectedOrderId]);

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
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900">No Active Deliveries</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You do not have any delivery tasks in progress right now. Check the radar feed to claim orders.
            </p>
          </div>
          <Link
            href="/rider"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition shadow-sm cursor-pointer"
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
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Active Trips ({activeDeliveries.length})
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Flexible fulfillment: pick up and deliver in whatever order you choose
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/rider"
              className="px-2.5 py-1.5 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
              title="Claim more orders from radar"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add</span> Order
            </Link>

            <span className="inline-flex items-center px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black whitespace-nowrap shadow-2xs">
              +{formatBDT(totalBatchEarnings)}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Select Active Task
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none -mx-1 px-1">
            {activeDeliveries.map((order) => {
              const orderId = order.id || order._id;
              const isSelected = (currentSelectedOrder?.id || currentSelectedOrder?._id) === orderId;

              const isPickedUp = order.status === 'PICKED_UP';
              const isFoodReady = order.status === 'READY_FOR_PICKUP';
              const isPreparing = order.status === 'PREPARING';

              const statusBadgeLabel = isPickedUp
                ? 'On Way'
                : isFoodReady
                ? 'Ready'
                : isPreparing
                ? 'Cooking'
                : 'Assigned';

              const statusBadgeClass = isPickedUp
                ? 'bg-blue-100 text-blue-800'
                : isFoodReady
                ? 'bg-emerald-100 text-emerald-800'
                : isPreparing
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-200 text-slate-700';

              return (
                <button
                  key={orderId}
                  type="button"
                  onClick={() => setSelectedOrderId(orderId)}
                  className={`shrink-0 text-left p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer min-w-[155px] sm:min-w-[170px] ${
                    isSelected
                      ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 shadow-xs'
                      : 'bg-slate-50/90 hover:bg-slate-100/80 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span
                      className={`text-[11px] font-black ${
                        isSelected ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      #{order.order_number}
                    </span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${statusBadgeClass}`}
                    >
                      {statusBadgeLabel}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-slate-700 truncate leading-tight">
                    {order.restaurant_id?.name || 'Restaurant'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                    {order.customer_name || 'Customer'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentSelectedOrder && (
        <ActiveDeliveryCard
          key={currentSelectedOrder.id || currentSelectedOrder._id}
          order={currentSelectedOrder}
        />
      )}
    </div>
  );
}
