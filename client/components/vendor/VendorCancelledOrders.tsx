// cancelled orders history view for restaurant vendors
'use client';

import React, { useState } from 'react';
import { useMyOrdersQuery } from '@/hooks/queries/use-order-queries';
import type { Order } from '@/types';
import { formatBDT } from '@/lib/utils';
import { WhatsAppPhoneLink } from '@/components/ui/WhatsAppPhoneLink';
import {
  Ban,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export function VendorCancelledOrders() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useMyOrdersQuery({
    page,
    limit: 10,
    status: 'CANCELLED',
  });

  const orders: Order[] = data?.orders || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Ban className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">
              Cancelled Orders History
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Orders cancelled or rejected before delivery
            </p>
          </div>
        </div>

        {pagination && pagination.total > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
            {pagination.total} {pagination.total === 1 ? 'order' : 'orders'}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading cancelled orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
            <Ban className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-700">No cancelled orders</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            You currently have no cancelled or rejected orders in your records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const orderId = order.id || order._id;
            const cancelledAt = order.updatedAt || order.createdAt;
            const formattedDate = cancelledAt
              ? new Date(cancelledAt).toLocaleDateString(undefined, {
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100/90 text-rose-800 text-[10px] font-extrabold border border-rose-200">
                        <Ban className="w-3 h-3 text-rose-600" />
                        Cancelled
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block">Food Total</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      {formatBDT(order.food_subtotal || order.grand_total)}
                    </span>
                  </div>
                </div>

                {order.cancellation_reason ? (
                  <div className="p-2.5 rounded-xl bg-rose-50/90 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-rose-950 block text-[11px] uppercase tracking-wider">
                        Cancellation Reason:
                      </span>
                      <p className="text-[11px] text-rose-800 font-semibold mt-0.5">
                        {order.cancellation_reason}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-100 text-xs text-rose-800 flex items-center gap-1.5 font-medium">
                    <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="text-[11px]">Order was cancelled before fulfillment.</span>
                  </div>
                )}

                <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 text-xs">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-700">
                      <span className="font-semibold">
                        {item.quantity}x {item.name || 'Food Item'}
                        {item.selected_variant && ` (${item.selected_variant.option_name})`}
                      </span>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 block font-mono">
                          {formatBDT(item.total_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {order.special_notes && (
                    <div className="pt-1 text-[11px] text-amber-800 flex items-start gap-1 border-t border-slate-100 mt-1">
                      <FileText className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                      <span>Note: {order.special_notes}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-200/60 min-w-0">
                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800 truncate">
                        {order.customer_name || 'Customer'}
                      </p>
                      {order.customer_phone && (
                        <WhatsAppPhoneLink phone={order.customer_phone} className="text-[11px]" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {order.delivery_address_text}
                    </p>
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
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center gap-2 cursor-pointer shadow-2xs"
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
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 active:scale-[0.98] transition-transform flex items-center gap-2 cursor-pointer shadow-2xs"
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
