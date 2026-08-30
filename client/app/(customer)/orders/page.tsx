'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useCustomerOrdersQuery } from '@/hooks/queries/use-order-queries';
import { Badge } from '@/components/ui/Badge';
import { formatBDT } from '@/lib/utils';
import {
  ReceiptText,
  Clock,
  ArrowRight,
  Store,
  MapPin,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function CustomerOrdersPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading: isOrdersLoading } = useCustomerOrdersQuery(page, limit, isAuthenticated);

  const orders = data?.orders || [];
  const pagination = data?.pagination;

  if (isAuthLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
          <ReceiptText className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Sign in to track orders</h2>
        <p className="text-xs text-slate-500 max-w-xs">
          View your active deliveries, real-time live stepper progress, and meal receipts.
        </p>
        <Link
          href="/auth/login"
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Your Orders</h1>
          <p className="text-xs text-slate-500">Live order updates and past delivery receipts.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-2xs shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Polling</span>
        </div>
      </div>

      {isOrdersLoading && orders.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-2 animate-pulse">
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No orders yet</h3>
          <p className="text-xs text-slate-400">Order hot food from Dhaka top restaurants.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
            Start Ordering
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const orderId = order.id || order._id;
            const restaurantName =
              typeof order.restaurant_id === 'object' && order.restaurant_id
                ? order.restaurant_id.name
                : 'Restaurant';

            const itemsSummary =
              order.items && order.items.length > 0
                ? order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')
                : '';

            return (
              <Link
                key={orderId}
                href={`/orders/${orderId}`}
                className="block bg-white rounded-3xl border border-slate-200/90 p-4 hover:border-slate-300 transition shadow-xs active:scale-[0.99]"
              >
                <div className="border-b border-slate-100 pb-2.5 mb-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-black text-slate-900 truncate">
                      #{order.order_number}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <Badge status={order.status} />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Store className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{restaurantName}</span>
                  </div>

                  {itemsSummary && (
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {itemsSummary}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-black text-rose-600">{formatBDT(order.grand_total)}</span>
                    <span className="text-slate-500 font-bold flex items-center gap-1">
                      Track Live <ArrowRight className="w-3 h-3 text-rose-600" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-3 px-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                      page === pageNum
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs"
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
