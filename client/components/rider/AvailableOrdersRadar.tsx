// live order radar feed for available zone orders
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRiderAvailableOrdersQuery } from '@/hooks/queries/use-rider-queries';
import { useRiderAcceptOrderMutation } from '@/hooks/queries/use-order-queries';
import type { Order } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  Radar,
  Store,
  MapPin,
  Clock,
  Banknote,
  ArrowRight,
  AlertCircle,
  Loader2,
  Package,
  Bike,
} from 'lucide-react';

interface AvailableOrdersRadarProps {
  isOnline: boolean;
  hasActiveDelivery?: boolean;
  activeDeliveryCount?: number;
  onOrderAccepted?: () => void;
}

export function AvailableOrdersRadar({
  isOnline,
  activeDeliveryCount = 0,
  onOrderAccepted,
}: AvailableOrdersRadarProps) {
  const { data: availableOrders = [], isLoading, isFetching } = useRiderAvailableOrdersQuery(
    isOnline
  );
  const acceptMutation = useRiderAcceptOrderMutation();
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAccept = (orderId: string) => {
    setError('');
    setAcceptingOrderId(orderId);
    acceptMutation.mutate(orderId, {
      onSuccess: () => {
        onOrderAccepted?.();
      },
      onError: (err: any) => {
        setError(err.message || 'failed to claim delivery task');
      },
      onSettled: () => {
        setAcceptingOrderId(null);
      },
    });
  };

  if (!isOnline) {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 text-center space-y-4 shadow-xs animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
          <Radar className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-slate-900">Radar is Currently Paused</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Switch your status to <strong>Online</strong> in the top header to begin scanning your coverage zones for incoming delivery tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {activeDeliveryCount > 0 && (
        <div className="p-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">
              <strong>{activeDeliveryCount}</strong> active {activeDeliveryCount === 1 ? 'trip' : 'trips'} in progress. Claim more orders below to batch deliveries!
            </span>
          </div>
          <Link
            href="/rider/trip"
            className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-900 shrink-0 cursor-pointer active:scale-95 transition"
          >
            <span>Trips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
          </span>
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Live Zone Radar
          </h3>
          {isFetching && (
            <span className="text-[10px] text-slate-400 font-bold tracking-wide animate-pulse">
              (scanning...)
            </span>
          )}
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-black border border-slate-200/60">
          {availableOrders.length} available
        </span>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in shake duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-3 shadow-xs">
          <Loader2 className="w-7 h-7 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Scanning assigned coverage zones...</p>
        </div>
      ) : availableOrders.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white border border-slate-200/90 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800">No Orders in Your Zone Right Now</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Keep this screen active. Incoming orders broadcast to this radar in real time.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {availableOrders.map((order: Order) => {
            const orderId = order.id || order._id;
            const isAcceptingThis = acceptingOrderId === orderId;

            return (
              <div
                key={orderId}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300/90 hover:shadow-md transition-all duration-200 space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-mono font-black text-slate-400 block">
                      #{order.order_number}
                    </span>
                    <h4 className="text-base font-black text-slate-900 leading-tight truncate">
                      {order.restaurant_id?.name || 'Restaurant'}
                    </h4>
                    <p className="text-xs text-slate-500 leading-snug truncate">
                      {order.restaurant_id?.address}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-black shadow-2xs">
                      +{formatBDT(order.delivery_fee)}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">Fixed Earning</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-800">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-bold truncate">
                      Deliver to:{' '}
                      {typeof order.delivery_zone_id === 'object'
                        ? order.delivery_zone_id.name
                        : 'Zone'}{' '}
                      {order.delivery_subzone_id &&
                        `(${
                          typeof order.delivery_subzone_id === 'object'
                            ? order.delivery_subzone_id.name
                            : 'Subzone'
                        })`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-xs">
                    <Banknote className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-medium">
                      Grand Total: <strong>{formatBDT(order.grand_total)}</strong> (COD Collection)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={acceptMutation.isPending}
                  onClick={() => handleAccept(orderId)}
                  className="w-full h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 ring-2 ring-rose-200/50 cursor-pointer active:scale-[0.98] disabled:opacity-50 select-none"
                >
                  {isAcceptingThis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Claiming Task...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept Delivery Task</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
