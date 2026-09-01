// fulfilled orders history view for restaurant vendors
'use client';

import React, { useState } from 'react';
import { useMyOrdersQuery } from '@/hooks/queries/use-order-queries';
import type { Order } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  PackageCheck,
  User,
  Bike,
  Clock,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
  FileText,
} from 'lucide-react';

export function VendorCompletedOrders() {
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
              Fulfilled Orders History
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Delivered and settled kitchen orders
            </p>
          </div>
        </div>

        {pagination && pagination.total > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
            {pagination.total} {pagination.total === 1 ? 'order' : 'orders'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading fulfilled orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700">No fulfilled orders yet</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Orders prepared in your kitchen and delivered to customers will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const orderId = order.id || order._id;
            const riderUser =
              typeof order.rider_id === 'object' && order.rider_id?.user_id
                ? (order.rider_id.user_id as any)
                : null;
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
                    <span className="text-xs font-bold text-slate-400 block">Food Total</span>
                    <span className="text-sm font-black text-slate-900">
                      {formatBDT(order.food_subtotal || order.grand_total)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 text-xs">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700">
                      <span className="font-semibold">
                        {item.quantity}x {item.name || 'Food Item'}
                        {item.selected_variant && ` (${item.selected_variant.option_name})`}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatBDT(item.total_price)}
                      </span>
                    </div>
                  ))}
                  {order.special_notes && (
                    <div className="pt-1 text-[11px] text-amber-800 flex items-start gap-1">
                      <FileText className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                      <span>Note: {order.special_notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 text-xs pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {order.customer_name || 'Customer'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {order.delivery_address_text}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <Bike className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">
                        {riderUser?.name || 'Courier Partner'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {riderUser?.phone_number || 'Fulfilled Delivery'}
                      </p>
                    </div>
                  </div>
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
