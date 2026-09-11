// completed delivery trips history list for courier riders
'use client';

import React, { useState } from 'react';
import { useMyOrdersQuery } from '@/hooks/queries/use-order-queries';
import type { Order } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  PackageCheck,
  Store,
  MapPin,
  Clock,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShoppingBag,
} from 'lucide-react';

export function RiderCompletedDeliveries() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useMyOrdersQuery({
    page,
    limit: 10,
    status: 'DELIVERED',
  });

  const orders: Order[] = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              Completed Deliveries
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Verified fulfilled trip history
            </p>
          </div>
        </div>

        {pagination && pagination.total > 0 && (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-100">
            {pagination.total} {pagination.total === 1 ? 'trip' : 'trips'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-7 h-7 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-400 font-bold">Loading trip records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black text-slate-800">No completed deliveries yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Orders you deliver to customers will appear here with earning receipts.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const orderId = order.id || order._id;
            const restaurant = order.restaurant_id;
            const isCOD = order.payment_method === 'COD';
            const deliveredAt = order.delivered_at || order.updatedAt;
            const formattedDate = deliveredAt
              ? new Date(deliveredAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <div
                key={orderId}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">
                        #{order.order_number}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Delivered
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block tracking-tight">Earned</span>
                    <span className="text-sm font-black text-emerald-600">
                      +{formatBDT(order.delivery_fee)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/60">
                  <div className="flex items-start gap-2 min-w-0">
                    <Store className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 truncate">
                        {typeof restaurant === 'object' ? restaurant.name : 'Restaurant'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {typeof restaurant === 'object' ? restaurant.address : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 truncate">
                        {order.customer_name || 'Customer'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {order.delivery_address_text}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {isCOD
                        ? `COD Collected: ${formatBDT(order.grand_total)}`
                        : `Prepaid (${formatBDT(order.grand_total)})`}
                    </span>
                  </div>
                  {order.items && order.items.length > 0 ? (
                    <span className="font-semibold text-slate-400">
                      {order.items.length}{' '}
                      {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="h-10 px-4 rounded-xl border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
