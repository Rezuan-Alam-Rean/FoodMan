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
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">
              Completed Deliveries
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Verified fulfilled trip history
            </p>
          </div>
        </div>

        {pagination && pagination.total > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
            {pagination.total} {pagination.total === 1 ? 'trip' : 'trips'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading trip records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700">No completed deliveries yet</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Orders you fulfill and deliver to customers will appear here with delivery fee receipts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
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
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-slate-50/80 hover:border-slate-200 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900">
                        #{order.order_number}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 text-[10px] font-extrabold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Delivered
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block">Earned</span>
                    <span className="text-sm font-black text-emerald-600">
                      +{formatBDT(order.delivery_fee)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                  <div className="flex items-start gap-2 min-w-0">
                    <Store className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {typeof restaurant === 'object' ? restaurant.name : 'Restaurant'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {typeof restaurant === 'object' ? restaurant.address : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
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
                    <Banknote className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isCOD
                        ? `COD Collected: ${formatBDT(order.grand_total)}`
                        : `Prepaid (${formatBDT(order.grand_total)})`}
                    </span>
                  </div>
                  <span>
                    {order.items?.length || 1}{' '}
                    {(order.items?.length || 1) === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            );
          })}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
