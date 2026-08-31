// live order radar feed for available zone orders
'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface AvailableOrdersRadarProps {
  isOnline: boolean;
  hasActiveDelivery: boolean;
  onOrderAccepted?: () => void;
}

export function AvailableOrdersRadar({
  isOnline,
  hasActiveDelivery,
  onOrderAccepted,
}: AvailableOrdersRadarProps) {
  const { data: availableOrders = [], isLoading, isFetching } = useRiderAvailableOrdersQuery(
    isOnline && !hasActiveDelivery
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
      <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Radar className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-black text-slate-900">Radar is Paused</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Switch your status to <strong>Online</strong> to start scanning for available food deliveries.
          </p>
        </div>
      </div>
    );
  }

  if (hasActiveDelivery) {
    return (
      <div className="p-6 rounded-3xl bg-slate-100/80 border border-slate-200 text-center space-y-2">
        <p className="text-xs font-bold text-slate-600">
          Delivery task in progress. Complete your active order to receive new radar requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Live Zone Radar
          </h3>
          {isFetching && (
            <span className="text-[10px] text-slate-400 font-semibold">(scanning...)</span>
          )}
        </div>
        <span className="text-xs font-bold text-slate-500">
          {availableOrders.length} available
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Scanning assigned zones...</p>
        </div>
      ) : availableOrders.length === 0 ? (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700">No Orders in Your Zone Right Now</p>
          <p className="text-[11px] text-slate-400">
            Keep this screen open. Incoming requests will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableOrders.map((order: Order) => {
            const orderId = order.id || order._id;
            const isAcceptingThis = acceptingOrderId === orderId;

            return (
              <div
                key={orderId}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition space-y-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400">
                      #{order.order_number}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {order.restaurant_id?.name || 'Restaurant'}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                      {order.restaurant_id?.address}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black">
                      +{formatBDT(order.delivery_fee)}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Fixed Earning</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-semibold truncate">
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
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Banknote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Grand Total: {formatBDT(order.grand_total)} (COD Cash Collection)</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={acceptMutation.isPending}
                  onClick={() => handleAccept(orderId)}
                  className="w-full py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20 disabled:opacity-50"
                >
                  {isAcceptingThis ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
