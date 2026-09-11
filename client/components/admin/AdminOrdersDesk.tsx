// admin global orders oversight desk with status filtering and search
'use client';

import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Bike,
  Store,
  MapPin,
  ChevronDown,
  ChevronUp,
  XCircle,
  X,
} from 'lucide-react';
import { useAdminAllOrdersQuery, useAdminCancelOrderMutation } from '@/hooks/queries/use-admin-queries';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import { WhatsAppPhoneLink } from '@/components/ui/WhatsAppPhoneLink';
import { formatBDT } from '@/lib/utils';

type StatusFilter =
  | 'ALL'
  | 'PENDING_PAYMENT'
  | 'LOOKING_FOR_RIDER'
  | 'RIDER_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'CANCELLED';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All Orders' },
  { value: 'LOOKING_FOR_RIDER', label: 'Looking for Rider' },
  { value: 'PREPARING', label: 'Kitchen Cooking' },
  { value: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { value: 'PICKED_UP', label: 'On The Way' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-200',
  LOOKING_FOR_RIDER: 'bg-orange-100 text-orange-800 border-orange-200',
  RIDER_ACCEPTED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PREPARING: 'bg-violet-100 text-violet-800 border-violet-200',
  READY_FOR_PICKUP: 'bg-blue-100 text-blue-800 border-blue-200',
  PICKED_UP: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
};

const NON_CANCELLABLE = new Set(['DELIVERED', 'CANCELLED']);

function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminOrdersDesk() {
  const [activeTab, setActiveTab] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectedZone, setSelectedZone] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const { data: zones = [] } = useZonesQuery();
  const cancelMutation = useAdminCancelOrderMutation();

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedSearch(val), 350);
    setDebounceTimer(timer);
  };

  const { data, isLoading, isError, refetch } = useAdminAllOrdersQuery({
    status: activeTab === 'ALL' ? undefined : activeTab,
    search: debouncedSearch || undefined,
    zone_id: selectedZone || undefined,
    limit: 25,
  });

  const orders: any[] = Array.isArray(data?.orders) ? data.orders : [];
  const pagination = data?.pagination;

  const openCancelPrompt = (orderId: string) => {
    setCancellingOrderId(orderId);
    setCancelReason('');
    setCancelError('');
  };

  const closeCancelPrompt = () => {
    setCancellingOrderId(null);
    setCancelReason('');
    setCancelError('');
  };

  const handleConfirmCancel = async (orderId: string) => {
    setCancelError('');
    try {
      await cancelMutation.mutateAsync({ orderId, reason: cancelReason || 'cancelled by admin' });
      closeCancelPrompt();
    } catch (err: any) {
      setCancelError(err?.message || 'failed to cancel order');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">Orders Oversight</h2>
            <p className="text-[11px] text-slate-400 font-medium">all platform orders and delivery progress</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search order #, customer, address..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-11 sm:h-10 pl-10 pr-3.5 rounded-2xl border border-slate-200 bg-white text-slate-900 text-base sm:text-xs font-bold placeholder:font-medium placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition"
            />
          </div>

          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="h-11 sm:h-10 max-w-[140px] truncate px-3 py-2 rounded-2xl border border-slate-200 bg-white text-slate-900 text-base sm:text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-violet-500/20 cursor-pointer shrink-0"
          >
            <option value="">All Zones</option>
            {zones.map((z) => (
              <option key={z._id} value={z._id}>{z.name}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => refetch()}
            className="w-11 h-11 sm:w-10 sm:h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 flex items-center justify-center text-slate-500 transition cursor-pointer shrink-0 shadow-2xs"
            title="Refresh orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-hide">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-black transition whitespace-nowrap shrink-0 cursor-pointer active:scale-95 ${
              activeTab === tab.value
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">failed to load orders</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold active:scale-95 transition cursor-pointer shadow-xs"
          >
            Try Again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">no orders found matching current criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const isExpanded = expandedOrderId === order._id;
            const isCancelling = cancellingOrderId === order._id;
            const statusClass = STATUS_BADGE[order.status] || 'bg-slate-100 text-slate-700 border-slate-200';
            const riderUser = order.rider_id?.user_id;
            const canCancel = !NON_CANCELLABLE.has(order.status);

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3.5 transition hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{order.order_number}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusClass}`}>
                        {order.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(order.createdAt)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900">{formatBDT(order.grand_total)}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {order.payment_method?.replace(/_/g, ' ')}
                      </p>
                    </div>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => openCancelPrompt(order._id)}
                        title="Force cancel this order"
                        className="min-w-[38px] min-h-[38px] rounded-2xl flex items-center justify-center text-rose-500 hover:text-rose-700 bg-rose-50 border border-rose-200 hover:border-rose-300 transition cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <XCircle className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>

                {isCancelling && (
                  <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-rose-900">Force cancel this order?</p>
                      <button
                        type="button"
                        onClick={closeCancelPrompt}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-100/50 transition cursor-pointer active:scale-95"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Cancellation reason (e.g. Out of stock, Customer request)..."
                      className="w-full min-h-[44px] sm:min-h-[40px] px-3.5 py-2.5 rounded-xl border border-rose-200 bg-white text-base sm:text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-400/30 placeholder:font-normal placeholder:text-slate-300"
                    />
                    {cancelError && (
                      <p className="text-xs text-rose-700 font-bold">{cancelError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={closeCancelPrompt}
                        className="flex-1 min-h-[44px] py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer shadow-2xs"
                      >
                        Keep Order
                      </button>
                      <button
                        type="button"
                        disabled={cancelMutation.isPending}
                        onClick={() => handleConfirmCancel(order._id)}
                        className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-black transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-rose-600/20"
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        Confirm Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <User className="w-3 h-3" />
                      <span>Customer</span>
                    </div>
                    <p className="font-black text-slate-900">{order.customer_id?.name || order.customer_name || 'Guest'}</p>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {order.customer_id?.phone_number || order.customer_phone ? (
                        <WhatsAppPhoneLink phone={order.customer_id?.phone_number || order.customer_phone} />
                      ) : (
                        <span>—</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <Store className="w-3 h-3" />
                      <span>Restaurant</span>
                    </div>
                    <p className="font-black text-slate-900">{order.restaurant_id?.name || '—'}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{order.restaurant_id?.address || '—'}</p>
                    {order.restaurant_id?.phone_number && (
                      <div className="text-[11px] text-slate-500 font-medium">
                        <WhatsAppPhoneLink phone={order.restaurant_id.phone_number} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <Bike className="w-3 h-3" />
                      <span>Rider Courier</span>
                    </div>
                    {riderUser ? (
                      <>
                        <p className="font-black text-slate-900">{riderUser.name}</p>
                        <div className="text-[11px] text-slate-500 font-medium">
                          <WhatsAppPhoneLink phone={riderUser.phone_number} />
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-amber-600 font-bold italic">Not assigned yet</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="font-medium truncate max-w-xs">{order.delivery_address_text}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-violet-700 active:scale-95 flex items-center gap-1.5 cursor-pointer transition shrink-0 ml-2 shadow-2xs"
                  >
                    <span>{isExpanded ? 'Hide items' : `${order.items?.length || 0} items`}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                    <div className="space-y-1.5">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-slate-700">
                          <span className="font-semibold">
                            {item.name || item.food_item_id?.name || 'Item'} × {item.quantity}
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">{formatBDT(item.total_price)}</span>
                            {item.original_unit_price && item.original_unit_price > item.unit_price && (
                              <span className="text-[10px] text-slate-400 line-through block">
                                {formatBDT(item.original_unit_price * item.quantity)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Food: {formatBDT(order.food_subtotal)} + Delivery: {formatBDT(order.delivery_fee)}</span>
                      <span className="font-black text-slate-900 text-xs">Total: {formatBDT(order.grand_total)}</span>
                    </div>

                    {order.cancellation_reason && (
                      <div className="pt-2 border-t border-rose-100">
                        <p className="text-[11px] text-rose-600 font-semibold">
                          cancellation reason: {order.cancellation_reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <p className="text-center text-[11px] text-slate-400 font-medium pt-2">
          showing {orders.length} of {pagination.total} orders
        </p>
      )}
    </div>
  );
}
