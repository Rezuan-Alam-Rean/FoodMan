// customer live order tracking stepper page with polling
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOrderTracking } from '@/hooks/use-order-tracking';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/Badge';
import { reviewSchema, type ReviewFormValues } from '@/lib/validations/review';
import { SetPasswordModal } from '@/components/auth/SetPasswordModal';
import { WhatsAppPhoneLink, WhatsAppIcon } from '@/components/ui/WhatsAppPhoneLink';
import { getWhatsAppUrl, formatBDT } from '@/lib/utils';
import {
  Bike,
  Store,
  MapPin,
  CheckCircle,
  AlertCircle,
  Phone,
  Star,
  XCircle,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  Lock,
} from 'lucide-react';

const TRACKING_STEPS = [
  { key: 'LOOKING_FOR_RIDER', label: 'Matching Rider', desc: 'Alerting riders in your delivery zone' },
  { key: 'RIDER_ACCEPTED', label: 'Rider Assigned', desc: 'Rider is en route to restaurant' },
  { key: 'PREPARING', label: 'Kitchen Cooking', desc: 'Restaurant is preparing your hot feast' },
  { key: 'READY_FOR_PICKUP', label: 'Food Ready', desc: 'Packed and waiting at kitchen counter' },
  { key: 'PICKED_UP', label: 'Out for Delivery', desc: 'Rider is on the way to your doorstep' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Enjoy your meal!' },
];

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { user } = useAuth();

  const {
    order,
    payment,
    currentStep,
    isCancellationLocked,
    isDelivered,
    isCancelled,
    isLoading,
    isError,
    cancelOrder,
    submitReview,
    isCancelling,
    isSubmittingReview,
  } = useOrderTracking(orderId);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [foodRating, setFoodRating] = useState(5);
  const [riderRating, setRiderRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const {
    register: registerReview,
    handleSubmit: handleReviewSubmit,
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      food_review: '',
      rider_review: '',
    },
  });

  const handleCopyOrderNumber = async () => {
    if (!order?.order_number) return;
    try {
      await navigator.clipboard.writeText(order.order_number);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Order not found</h2>
        <p className="text-xs text-slate-500">Could not retrieve tracking details for this order.</p>
        <Link href="/" className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  const handleCancel = () => {
    setCancelError('');
    cancelOrder(
      cancelReason,
      () => setCancelModalOpen(false),
      (err) => setCancelError(err.message)
    );
  };

  const onReviewSubmit = (values: ReviewFormValues) => {
    submitReview(
      {
        food_rating: foodRating,
        food_review: values.food_review?.trim(),
        rider_rating: order.rider_id ? riderRating : undefined,
        rider_review: values.rider_review?.trim(),
      },
      () => setReviewSubmitted(true)
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-32 sm:pb-36 max-w-3xl mx-auto">
      {user?.has_password === false && !isBannerDismissed && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-100 truncate">Guest account created</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">Set a password to easily sign in next time.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs transition-transform active:scale-[0.98] cursor-pointer shadow-xs"
            >
              Set Password
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-amber-500 hover:text-amber-700 text-xs cursor-pointer font-bold transition-transform active:scale-[0.98]"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <Link
          href="/orders"
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-transform shadow-xs active:scale-[0.98] shrink-0 mt-0.5 cursor-pointer"
          title="Back to orders"
          aria-label="Back to orders"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              #{order.order_number}
            </h1>
            <button
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-transform active:scale-[0.98] cursor-pointer shadow-2xs"
              title="Copy order number"
              aria-label="Copy order number"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge status={order.status} />
            <span className="text-xs text-slate-400 font-medium">
              Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {isCancellationLocked && !isDelivered && !isCancelled && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center gap-2.5 text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-semibold">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
          <span>
            Cancellation is locked: food preparation is in progress with the kitchen and assigned rider.
          </span>
        </div>
      )}

      {isCancelled && (
        <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold">
          <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>
            Order cancelled: {order.cancellation_reason || 'cancellation confirmed'}
          </span>
        </div>
      )}

      {!isCancelled && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Live Delivery Progress
            </h2>
            {!isDelivered && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Polling</span>
              </div>
            )}
          </div>

          <div className="space-y-6 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {TRACKING_STEPS.map((step, idx) => {
              const stepNum = idx + 1;
              const isPassed = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;

              return (
                <div key={step.key} className="relative flex items-start gap-4 pl-0.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition shrink-0 ${
                      isPassed
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : isCurrent
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100 dark:ring-rose-950/60 animate-pulse shadow-md shadow-rose-600/30'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div className="space-y-0.5 pt-0.5">
                    <h4
                      className={`text-xs sm:text-sm font-extrabold ${
                        isPassed || isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.rider_id && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
              <Bike className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assigned Rider
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                {order.rider_id.user_id?.name || 'Speedy Rider'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold">{order.rider_id.rating_avg > 0 ? order.rider_id.rating_avg.toFixed(1) : '5.0'}</span>
                <span>• {order.rider_id.vehicle_type || 'Motorcycle'}</span>
              </p>
            </div>
          </div>

          {order.rider_id.user_id?.phone_number && (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={getWhatsAppUrl(
                  order.rider_id.user_id.phone_number,
                  `Hello! Regarding order #${order.order_number || order._id?.slice(-6) || ''}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 flex items-center gap-2 text-xs font-extrabold shadow-xs active:scale-[0.98] transition-transform cursor-pointer"
                title="Chat on WhatsApp"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`tel:${order.rider_id.user_id.phone_number}`}
                className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center gap-2 text-xs font-extrabold active:scale-[0.98] transition-transform cursor-pointer"
                title="Direct Phone Call"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </a>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
        <div className="space-y-1.5 sm:pr-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Store className="w-4 h-4 text-rose-500" />
            <span>Kitchen</span>
          </div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
            {order.restaurant_id?.name}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{order.restaurant_id?.address}</p>
          {order.restaurant_id?.phone_number && (
            <div className="pt-1">
              <WhatsAppPhoneLink phone={order.restaurant_id.phone_number} />
            </div>
          )}
        </div>

        <div className="space-y-1.5 pt-3 sm:pt-0 sm:pl-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>Delivery Destination</span>
          </div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-1.5 flex-wrap">
            <span>{order.customer_name}</span>
            {order.customer_phone && (
              <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">
                (<WhatsAppPhoneLink phone={order.customer_phone} />)
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">{order.delivery_address_text}</p>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3.5">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2.5">
            Order Items & Customizations
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md">
                      {item.quantity}x
                    </span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                      {item.name}
                    </h4>
                  </div>

                  {item.selected_variant && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 pl-8">
                      <span className="font-medium">{item.selected_variant.group_title}:</span>{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.selected_variant.option_name}</span>
                    </p>
                  )}

                  {item.selected_add_ons && item.selected_add_ons.length > 0 && (
                    <p className="text-xs text-slate-400 pl-8">
                      + {item.selected_add_ons.map((a: any) => a.name).join(', ')}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    {formatBDT(item.total_price || item.unit_price * item.quantity)}
                  </span>
                  {item.original_unit_price && item.original_unit_price > item.unit_price && (
                    <span className="font-mono text-[11px] text-slate-400 line-through block">
                      {formatBDT(item.original_unit_price * item.quantity)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {order.special_notes && order.special_notes.trim() && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Special Instructions
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 italic">
                &ldquo;{order.special_notes.trim()}&rdquo;
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Food Subtotal</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatBDT(order.food_subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatBDT(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatBDT(order.service_fee || 0)}</span>
            </div>
            <div className="flex justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base">
              <span>Grand Total</span>
              <span className="font-mono font-black text-rose-600 text-lg">{formatBDT(order.grand_total)}</span>
            </div>
          </div>
        </div>
      )}

      {payment && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Payment Info
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
                payment.status === 'VERIFIED'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
              }`}
            >
              {payment.status === 'VERIFIED' ? 'Verified' : 'Pending Verification'}
            </span>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Method</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {payment.method === 'COD' ? 'Cash on Delivery' : payment.method}
              </span>
            </div>

            {payment.sender_number && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Sender Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payment.sender_number}</span>
              </div>
            )}

            {payment.transaction_id && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 uppercase">{payment.transaction_id}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Amount</span>
              <span className="font-mono font-black text-rose-600 text-sm sm:text-base">{formatBDT(payment.amount)}</span>
            </div>
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">How was your meal?</h3>
          </div>

          {reviewSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5" />
              <span>Thank you for reviewing! Your feedback helps our kitchens.</span>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit(onReviewSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Food Rating (1-5 Stars)</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFoodRating(star)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2 text-amber-400 hover:scale-110 cursor-pointer active:scale-[0.98] transition-transform"
                      aria-label={`Rate food ${star} star`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= foodRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                {...registerReview('food_review')}
                placeholder="Share a short note about food taste..."
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />

              {order.rider_id && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Rider Delivery Rating (1-5 Stars)</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRiderRating(star)}
                          className="w-11 h-11 min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2 text-amber-400 hover:scale-110 cursor-pointer active:scale-[0.98] transition-transform"
                          aria-label={`Rate rider ${star} star`}
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= riderRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="text"
                    {...registerReview('rider_review')}
                    placeholder="Share feedback on delivery speed and rider behavior..."
                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="min-h-[48px] py-3 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-600/20 active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReview ? 'Submitting Review...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {!isCancellationLocked && !isCancelled && (
        <button
          onClick={() => setCancelModalOpen(true)}
          className="w-full min-h-[48px] py-3 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-extrabold text-xs sm:text-sm active:scale-[0.98] transition-transform cursor-pointer"
        >
          Cancel Order
        </button>
      )}

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setCancelModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl z-10 border border-slate-200/80 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Cancel Order?</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Are you sure you want to cancel this order?
            </p>

            {cancelError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {cancelError}
              </div>
            )}

            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 min-h-[44px] py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-extrabold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-transform cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 min-h-[44px] py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={() => setIsPasswordModalOpen(false)}
        isGuestPrompt={true}
      />
    </div>
  );
}
