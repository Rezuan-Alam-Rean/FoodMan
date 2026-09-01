// live kitchen orders desk with real-time queue synchronization and action controls
'use client';

import React, { useState } from 'react';
import {
  useRestaurantLiveOrdersQuery,
  useRestaurantAcceptAndCookMutation,
  useRestaurantFoodReadyMutation,
} from '@/hooks/queries/use-order-queries';
import type { Restaurant, Order, OrderItem } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  UtensilsCrossed,
  ChefHat,
  Bike,
  User,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Loader2,
  PackageCheck,
  CheckCircle2,
  Copy,
  Check,
  X,
  FileText,
  Flame,
} from 'lucide-react';
import { VendorCompletedOrders } from './VendorCompletedOrders';

interface KitchenLiveDeskProps {
  restaurant: Restaurant;
}

type FilterStage = 'ALL' | 'AWAITING' | 'PREPARING' | 'READY' | 'COMPLETED';

export function KitchenLiveDesk({ restaurant }: KitchenLiveDeskProps) {
  const restaurantId = restaurant.id || restaurant._id;
  const [selectedFilter, setSelectedFilter] = useState<FilterStage>('ALL');
  const [actionError, setActionError] = useState('');
  const [contactModal, setContactModal] = useState<{
    name: string;
    phone: string;
    role: string;
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const { data: liveOrders = [], isLoading: isOrdersLoading } = useRestaurantLiveOrdersQuery(
    restaurantId,
    Boolean(restaurantId)
  );

  const acceptAndCookMutation = useRestaurantAcceptAndCookMutation(restaurantId);
  const foodReadyMutation = useRestaurantFoodReadyMutation(restaurantId);

  const filteredOrders = liveOrders.filter((order) => {
    if (selectedFilter === 'AWAITING') {
      return (
        order.status === 'LOOKING_FOR_RIDER' || order.status === 'RIDER_ACCEPTED'
      );
    }
    if (selectedFilter === 'PREPARING') {
      return order.status === 'PREPARING';
    }
    if (selectedFilter === 'READY') {
      return order.status === 'READY_FOR_PICKUP';
    }
    return true;
  });

  const awaitingCount = liveOrders.filter(
    (o) => o.status === 'LOOKING_FOR_RIDER' || o.status === 'RIDER_ACCEPTED'
  ).length;
  const preparingCount = liveOrders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = liveOrders.filter((o) => o.status === 'READY_FOR_PICKUP').length;

  const handleAcceptAndCook = (orderId: string) => {
    setActionError('');
    acceptAndCookMutation.mutate(orderId, {
      onError: (err: any) => {
        setActionError(err.message || 'failed to accept order and start preparation');
      },
    });
  };

  const handleMarkFoodReady = (orderId: string) => {
    setActionError('');
    foodReadyMutation.mutate(orderId, {
      onError: (err: any) => {
        setActionError(err.message || 'failed to mark food ready for pickup');
      },
    });
  };

  const handleCopyPhone = async () => {
    if (!contactModal?.phone) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contactModal.phone);
      } else {
        throw new Error('clipboard write text unavailable');
      }
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = contactModal.phone;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch {
        // ignore fallback failure
      }
      textArea.remove();
    }
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">Live Kitchen Queue</h2>
            <p className="text-[11px] text-slate-400 font-medium">Auto-refreshing every 6 seconds</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({liveOrders.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('AWAITING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'AWAITING'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Awaiting ({awaitingCount})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('PREPARING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'PREPARING'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Cooking ({preparingCount})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('READY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'READY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Ready ({readyCount})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedFilter === 'COMPLETED'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {selectedFilter === 'COMPLETED' ? (
        <VendorCompletedOrders />
      ) : isOrdersLoading ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-2.5">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Synchronizing kitchen queue...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900">No Orders in This Stage</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {selectedFilter === 'ALL'
                ? 'New incoming customer orders will appear here automatically.'
                : 'Switch filters or wait for new orders to arrive.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order: Order) => {
            const orderId = order.id || order._id;
            const isAwaitingAccept =
              order.status === 'LOOKING_FOR_RIDER' || order.status === 'RIDER_ACCEPTED';
            const isPreparing = order.status === 'PREPARING';
            const isReady = order.status === 'READY_FOR_PICKUP';

            const riderObj: any = order.rider_id;
            const riderUser = riderObj?.user_id;
            const hasRider = Boolean(riderObj && riderUser);

            return (
              <div
                key={orderId}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">
                        #{order.order_number}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isReady
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPreparing
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isReady
                          ? 'Food Ready'
                          : isPreparing
                          ? 'Cooking in Progress'
                          : hasRider
                          ? 'Rider Assigned'
                          : 'Broadcasting to Riders'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Customer: <strong className="text-slate-700">{order.customer_name}</strong> •{' '}
                      {order.delivery_address_text}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900">
                      {formatBDT(order.food_subtotal)}
                    </span>
                    <p className="text-[10px] font-bold text-slate-400">Food Subtotal</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Customer Contact
                        </span>
                        <p className="font-black text-slate-900">{order.customer_name}</p>
                      </div>
                    </div>
                    {order.customer_phone && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCopied(false);
                          setContactModal({
                            name: order.customer_name,
                            phone: order.customer_phone,
                            role: 'Customer',
                          });
                        }}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                        title="contact customer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Bike className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          Assigned Courier
                        </span>
                        <p className="font-black text-slate-900">
                          {hasRider ? riderUser.name || 'Courier Partner' : 'Awaiting claim...'}
                        </p>
                      </div>
                    </div>
                    {hasRider && riderUser.phone_number && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCopied(false);
                          setContactModal({
                            name: riderUser.name || 'Courier Partner',
                            phone: riderUser.phone_number,
                            role: 'Delivery Rider',
                          });
                        }}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                        title="contact courier"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60 pb-1.5">
                    <span>Ordered Items</span>
                    <span>{order.items?.length || 0} items</span>
                  </div>

                  <div className="space-y-1.5">
                    {order.items?.map((item: OrderItem, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between text-xs text-slate-800"
                      >
                        <div>
                          <p className="font-bold leading-tight">
                            <span className="text-rose-600 font-black mr-1.5">
                              {item.quantity}x
                            </span>
                            {item.name}
                          </p>
                          {item.selected_variant && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Variant: {item.selected_variant.group_title} (
                              {item.selected_variant.option_name})
                            </p>
                          )}
                          {item.selected_add_ons && item.selected_add_ons.length > 0 && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              + {item.selected_add_ons.map((a: any) => a.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-black text-slate-900 shrink-0 ml-2">
                          {formatBDT(item.total_price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.special_notes && (
                    <div className="pt-2 border-t border-slate-200/60 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50/60 p-2 rounded-xl">
                      <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <p>
                        <strong>Special Note:</strong> {order.special_notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  {order.status === 'LOOKING_FOR_RIDER' && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>Broadcasting to Couriers • Preparation unlocks when rider claims</span>
                    </div>
                  )}

                  {order.status === 'RIDER_ACCEPTED' && (
                    <button
                      type="button"
                      disabled={acceptAndCookMutation.isPending}
                      onClick={() => handleAcceptAndCook(orderId)}
                      className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {acceptAndCookMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Flame className="w-4 h-4" />
                          <span>Rider Assigned • Accept & Start Cooking</span>
                        </>
                      )}
                    </button>
                  )}

                  {isPreparing && (
                    <button
                      type="button"
                      disabled={foodReadyMutation.isPending}
                      onClick={() => handleMarkFoodReady(orderId)}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {foodReadyMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <PackageCheck className="w-4 h-4" />
                          <span>Mark Food Ready for Pickup</span>
                        </>
                      )}
                    </button>
                  )}

                  {isReady && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Food Packaged • Waiting for Courier Pickup</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {contactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {contactModal.role} Contact
                  </h3>
                  <p className="text-xs text-slate-400">{contactModal.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Phone Number
              </span>
              <p className="text-lg font-black text-slate-900 tracking-wide select-all">
                {contactModal.phone}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyPhone}
                className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>

              <a
                href={`tel:${contactModal.phone}`}
                className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm text-center"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Directly</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
