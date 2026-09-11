'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useCustomerOrdersQuery } from '@/hooks/queries/use-order-queries';
import { Badge } from '@/components/ui/Badge';
import { formatBDT } from '@/lib/utils';
import {
  ReceiptText,
  ArrowRight,
  Store,
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-100 to-rose-50 dark:from-rose-950/40 dark:to-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
          <ReceiptText className="w-10 h-10" />
        </div>
        <div className="space-y-1.5 max-w-xs">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Sign in to track orders
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            View your active deliveries, real-time live stepper progress, and meal receipts.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md shadow-rose-600/20 active:scale-[0.98] transition-transform cursor-pointer"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-32 sm:pb-36 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Your Orders</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Live order updates and past delivery receipts.</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Polling</span>
        </div>
      </div>

      {isOrdersLoading && orders.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3 animate-pulse shadow-xs">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4" />
                <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded-lg w-1/5" />
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-850 rounded-lg w-2/5" />
              <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded-lg w-3/4" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-10 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">No orders yet</h3>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500">Order hot food from Dhaka top restaurants.</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center min-h-[48px] px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-md shadow-rose-600/20 active:scale-[0.98] transition-transform cursor-pointer"
          >
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
                className="block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs active:scale-[0.98] transition-transform group"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-black text-slate-900 dark:text-white truncate">
                      #{order.order_number}
                    </span>
                    <span className="text-xs text-slate-400 font-medium shrink-0">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <Badge status={order.status} />
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
                    <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{restaurantName}</span>
                  </div>

                  {itemsSummary && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 pl-8">
                      {itemsSummary}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="font-black text-rose-600 dark:text-rose-400 text-sm sm:text-base font-mono">
                      {formatBDT(order.grand_total)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-extrabold text-xs group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 transition">
                      Track Live <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 pt-4 px-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
                className="inline-flex items-center gap-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-transform disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl text-xs sm:text-sm font-black transition-transform cursor-pointer flex items-center justify-center active:scale-[0.98] ${
                      page === pageNum
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
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
                className="inline-flex items-center gap-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold transition-transform disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-xs active:scale-[0.98]"
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
