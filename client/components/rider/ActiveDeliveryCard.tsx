// live active delivery task execution card for couriers
'use client';

import React, { useState } from 'react';
import {
  useRiderPickupMutation,
  useRiderDeliverMutation,
} from '@/hooks/queries/use-order-queries';
import type { Order } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  Store,
  MapPin,
  Phone,
  PackageCheck,
  CheckCircle2,
  Clock,
  Banknote,
  FileText,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface ActiveDeliveryCardProps {
  order: Order;
}

export function ActiveDeliveryCard({ order }: ActiveDeliveryCardProps) {
  const [confirmDeliverModalOpen, setConfirmDeliverModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [contactModal, setContactModal] = useState<{
    name: string;
    phone: string;
    role: 'Customer' | 'Restaurant';
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const pickupMutation = useRiderPickupMutation();
  const deliverMutation = useRiderDeliverMutation();

  const isPickedUp = order.status === 'PICKED_UP';
  const isFoodReady = order.status === 'READY_FOR_PICKUP';
  const isPreparing = order.status === 'PREPARING';
  const isPendingKitchen = order.status === 'RIDER_ACCEPTED';

  const isCOD = order.payment_method === 'COD';

  const handleConfirmPickup = () => {
    setActionError('');
    pickupMutation.mutate(order.id || order._id, {
      onError: (err: any) => {
        setActionError(err.message || 'failed to update pickup status');
      },
    });
  };

  const handleConfirmDelivery = () => {
    setActionError('');
    deliverMutation.mutate(order.id || order._id, {
      onSuccess: () => {
        setConfirmDeliverModalOpen(false);
      },
      onError: (err: any) => {
        setActionError(err.message || 'failed to complete delivery');
      },
    });
  };

  const handleCopyPhone = async () => {
    if (!contactModal?.phone) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contactModal.phone);
      } else {
        throw new Error('clipboard api unavailable');
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
    <>
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-rose-500/80 shadow-md space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-black tracking-wide uppercase inline-flex items-center gap-1.5 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              Active Delivery
            </span>
            <p className="text-xs font-bold text-slate-500">#{order.order_number}</p>
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black whitespace-nowrap shadow-2xs">
              +{formatBDT(order.delivery_fee)}
            </span>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">Fixed Earning</p>
          </div>
        </div>

        {actionError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Kitchen Stage
            </span>
            <span
              className={`text-xs font-black px-2.5 py-0.5 rounded-lg shrink-0 ${
                isPickedUp
                  ? 'bg-blue-100 text-blue-800'
                  : isFoodReady
                  ? 'bg-emerald-100 text-emerald-800'
                  : isPreparing
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isPickedUp
                ? 'On The Way to Customer'
                : isFoodReady
                ? 'Food Ready for Pickup!'
                : isPreparing
                ? 'Kitchen is Cooking'
                : 'Awaiting Kitchen Accept'}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isPickedUp
              ? 'Food collected. Head to delivery address and hand over order.'
              : isFoodReady
              ? 'Kitchen has packaged the food. Collect package from pickup counter.'
              : isPreparing
              ? 'Head towards the restaurant while food is being prepared.'
              : 'The restaurant has been notified of your assignment.'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Store className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight">
                    {order.restaurant_id?.name || 'Restaurant'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {order.restaurant_id?.address || 'Restaurant Address'}
                  </p>
                </div>
              </div>
              {order.restaurant_id?.phone_number && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCopied(false);
                    setContactModal({
                      name: order.restaurant_id?.name || 'Restaurant',
                      phone: order.restaurant_id.phone_number || '',
                      role: 'Restaurant',
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition shrink-0 cursor-pointer"
                  title="call restaurant"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight">
                    {order.customer_name || 'Customer'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {order.delivery_address_text}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                    {typeof order.delivery_zone_id === 'object'
                      ? order.delivery_zone_id.name
                      : 'Zone'}{' '}
                    {order.delivery_subzone_id &&
                      `• ${
                        typeof order.delivery_subzone_id === 'object'
                          ? order.delivery_subzone_id.name
                          : 'Subzone'
                      }`}
                  </p>
                </div>
              </div>
              {order.customer_phone && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCopied(false);
                    setContactModal({
                      name: order.customer_name || 'Customer',
                      phone: order.customer_phone,
                      role: 'Customer',
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition shrink-0 cursor-pointer"
                  title="call customer"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}
            </div>

            {order.special_notes && (
              <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Customer Note:</strong> {order.special_notes}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-amber-600" />
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Payment Collection</span>
              <p className="text-xs font-black text-slate-900">
                {isCOD ? `Cash on Delivery (Collect ${formatBDT(order.grand_total)})` : 'Prepaid (৳0 to collect)'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-700">{formatBDT(order.grand_total)}</span>
        </div>

        <div className="pt-1">
          {isPendingKitchen ? (
            <div className="w-full py-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed">
              <Clock className="w-4 h-4 animate-spin text-slate-400" />
              <span>Awaiting Kitchen Acceptance...</span>
            </div>
          ) : !isPickedUp ? (
            <button
              type="button"
              disabled={pickupMutation.isPending}
              onClick={handleConfirmPickup}
              className={`w-full py-3.5 rounded-2xl text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-sm ${
                isFoodReady
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 ring-2 ring-rose-200 cursor-pointer'
                  : 'bg-slate-800 hover:bg-slate-900 cursor-pointer'
              }`}
            >
              {pickupMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>{isFoodReady ? 'Food Ready! Confirm Picked Up' : 'Confirm Food Picked Up'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDeliverModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/25 ring-2 ring-emerald-200 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Delivery & Hand Over</span>
            </button>
          )}
        </div>
      </div>

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
                    Contact {contactModal.role}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">{contactModal.name}</p>
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phone Number
              </span>
              <p className="text-lg font-black text-slate-900 tracking-wider">
                {contactModal.phone}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleCopyPhone}
                className={`w-full py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Phone Number</span>
                  </>
                )}
              </button>

              <a
                href={`tel:${contactModal.phone}`}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>Call Directly</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {confirmDeliverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Complete Delivery</h3>
              <p className="text-xs text-slate-500">
                Confirm you have handed the order to <strong>{order.customer_name}</strong>.
              </p>
            </div>

            {isCOD && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-0.5">
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Cash Collected from Customer
                </p>
                <p className="text-xl font-black text-amber-900">{formatBDT(order.grand_total)}</p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeliverModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deliverMutation.isPending}
                onClick={handleConfirmDelivery}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {deliverMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm Done'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
