// live active delivery task execution card for couriers
'use client';

import React, { useState } from 'react';
import {
  useRiderPickupMutation,
  useRiderDeliverMutation,
  useRiderCancelOrderMutation,
} from '@/hooks/queries/use-order-queries';
import type { Order, RiderActiveOrder } from '@/types';
import { formatBDT, getWhatsAppUrl } from '@/lib/utils';
import { WhatsAppPhoneLink, WhatsAppIcon } from '@/components/ui/WhatsAppPhoneLink';
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
  Flame,
  Undo2,
  AlertTriangle,
} from 'lucide-react';

interface ActiveDeliveryCardProps {
  order: Order | RiderActiveOrder;
}

export function ActiveDeliveryCard({ order }: ActiveDeliveryCardProps) {
  const [confirmDeliverModalOpen, setConfirmDeliverModalOpen] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [selectedPresetReason, setSelectedPresetReason] = useState('Vehicle breakdown / flat tire');
  const [actionError, setActionError] = useState('');
  const [contactModal, setContactModal] = useState<{
    name: string;
    phone: string;
    role: 'Customer' | 'Restaurant';
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const pickupMutation = useRiderPickupMutation();
  const deliverMutation = useRiderDeliverMutation();
  const riderCancelMutation = useRiderCancelOrderMutation();

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

  const handleConfirmRelease = () => {
    setActionError('');
    const finalReason =
      selectedPresetReason === 'Other'
        ? releaseReason.trim() || 'Courier released delivery'
        : releaseReason.trim()
        ? `${selectedPresetReason}: ${releaseReason.trim()}`
        : selectedPresetReason;

    riderCancelMutation.mutate(
      {
        orderId: order.id || order._id,
        reason: finalReason,
      },
      {
        onSuccess: () => {
          setReleaseModalOpen(false);
        },
        onError: (err: any) => {
          setActionError(err.message || 'Failed to release order');
        },
      }
    );
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
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-md space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-black tracking-wide uppercase inline-flex items-center gap-1.5 shrink-0 border border-rose-100">
              <Clock className="w-3.5 h-3.5" />
              Active Delivery
            </span>
            <p className="text-xs font-mono font-black text-slate-500">#{order.order_number}</p>
          </div>

          <div className="shrink-0 text-right">
            <span className="inline-flex items-center px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-black whitespace-nowrap shadow-2xs">
              +{formatBDT(order.delivery_fee)}
            </span>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight">Fixed Earning</p>
          </div>
        </div>

        {actionError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-in shake duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
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
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {isPickedUp
              ? 'Food collected. Head towards the delivery address and hand over the order.'
              : isFoodReady
              ? 'Kitchen has packaged the food. Collect package from the pickup counter.'
              : isPreparing
              ? 'Head towards the restaurant while food is being freshly prepared.'
              : 'The restaurant has been notified of your delivery assignment.'}
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-2 hover:border-slate-300 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <Store className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 leading-tight truncate">
                    {order.restaurant_id?.name || 'Restaurant'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate">
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
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-transform flex items-center justify-center shrink-0 cursor-pointer active:scale-[0.98] shadow-2xs"
                  title="Call restaurant"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200/90 bg-white space-y-2 hover:border-slate-300 transition">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 leading-tight truncate">
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
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-transform flex items-center justify-center shrink-0 cursor-pointer active:scale-[0.98] shadow-2xs"
                  title="Call customer"
                >
                  <Phone className="w-4 h-4" />
                </button>
              )}
            </div>

            {order.special_notes && (
              <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>Customer Note:</strong> {order.special_notes}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Collection</span>
              <p className="text-xs font-black text-slate-900">
                {isCOD ? `Cash on Delivery (Collect ${formatBDT(order.grand_total)})` : 'Prepaid (৳0 to collect)'}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-slate-800">{formatBDT(order.grand_total)}</span>
        </div>

        <div className="pt-1">
          {isPendingKitchen && (
            <div className="w-full h-13 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed">
              <Clock className="w-4 h-4 animate-spin text-amber-600" />
              <span>Waiting for Kitchen to accept</span>
            </div>
          )}

          {isPreparing && (
            <div className="w-full h-13 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed">
              <Flame className="w-4 h-4 animate-pulse text-rose-600" />
              <span>Food is being prepared at restaurant</span>
            </div>
          )}

          {isFoodReady && (
            <button
              type="button"
              disabled={pickupMutation.isPending}
              onClick={handleConfirmPickup}
              className="w-full h-13 sm:h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 ring-2 ring-rose-200/70 cursor-pointer active:scale-[0.98] disabled:opacity-50 select-none"
            >
              {pickupMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  <span>Food Ready! Confirm Picked Up & Start Delivery</span>
                </>
              )}
            </button>
          )}

          {isPickedUp && (
            <button
              type="button"
              onClick={() => setConfirmDeliverModalOpen(true)}
              className="w-full h-13 sm:h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-200/70 cursor-pointer active:scale-[0.98] select-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Delivery & Hand Over</span>
            </button>
          )}

          {!isPickedUp && (
            <button
              type="button"
              onClick={() => {
                setActionError('');
                setReleaseModalOpen(true);
              }}
              className="w-full min-h-[44px] h-11 mt-2.5 rounded-2xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 text-xs font-bold transition-transform flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Release Trip / Can't Deliver</span>
            </button>
          )}
        </div>
      </div>

      {contactModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 leading-tight truncate">
                    Contact {contactModal.role}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate">{contactModal.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModal(null)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-transform flex items-center justify-center cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phone Number
              </span>
              <div className="text-lg font-black text-slate-900 tracking-wider flex items-center justify-center">
                <WhatsAppPhoneLink phone={contactModal.phone} iconClassName="w-4 h-4 text-emerald-600" />
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <a
                href={getWhatsAppUrl(contactModal.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-transform flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 active:scale-[0.98]"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={`tel:${contactModal.phone}`}
                className="w-full min-h-[44px] h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-transform flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Phone className="w-4 h-4" />
                <span>Call Directly</span>
              </a>

              <button
                type="button"
                onClick={handleCopyPhone}
                className={`w-full min-h-[44px] h-11 rounded-2xl border text-xs font-bold transition-transform flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                  isCopied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Phone Number</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeliverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-2" />
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Complete Delivery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Confirm you have successfully handed the package to <strong>{order.customer_name}</strong>.
              </p>
            </div>

            {isCOD && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-0.5">
                <p className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                  Cash Collected from Customer
                </p>
                <p className="text-2xl font-black text-amber-900">{formatBDT(order.grand_total)}</p>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeliverModalOpen(false)}
                className="flex-1 min-h-[44px] h-12 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-transform cursor-pointer active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deliverMutation.isPending}
                onClick={handleConfirmDelivery}
                className="flex-1 min-h-[44px] h-12 rounded-2xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-transform shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
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

      {releaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-2" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 leading-tight truncate">
                    Release Delivery Trip
                  </h3>
                  <p className="text-xs text-slate-400 font-medium truncate">Order #{order.order_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReleaseModalOpen(false)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-transform flex items-center justify-center cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <p className="font-black">What happens when you release?</p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                This order will immediately return to the delivery radar for another courier to accept. The kitchen preserves cooking progress.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Select reason for releasing trip:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Vehicle breakdown / flat tire',
                  'Severe rain / bad weather',
                  'Personal emergency',
                  'Traffic jam / road blocked',
                  'Other',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSelectedPresetReason(preset)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-transform cursor-pointer active:scale-[0.98] ${
                      selectedPresetReason === preset
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {selectedPresetReason === 'Other' && (
                <textarea
                  rows={2}
                  value={releaseReason}
                  onChange={(e) => setReleaseReason(e.target.value)}
                  placeholder="Explain why you cannot complete this pickup..."
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 mt-2"
                />
              )}
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReleaseModalOpen(false)}
                className="flex-1 min-h-[44px] h-12 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-transform cursor-pointer active:scale-[0.98]"
              >
                Keep Delivery
              </button>
              <button
                type="button"
                disabled={riderCancelMutation.isPending}
                onClick={handleConfirmRelease}
                className="flex-1 min-h-[44px] h-12 rounded-2xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition-transform shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
              >
                {riderCancelMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm & Release'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
