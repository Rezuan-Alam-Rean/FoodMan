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
    <div className="space-y-4 pb-20">
      {user?.has_password === false && !isBannerDismissed && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-900 truncate">Guest account created</p>
              <p className="text-[11px] text-amber-700">Set a password to easily sign in next time.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] transition active:scale-95 cursor-pointer"
            >
              Set Password
            </button>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="text-amber-500 hover:text-amber-700 text-xs p-1 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <Link
          href="/orders"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition active:scale-95 shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-mono">
              #{order.order_number}
            </h1>
            <button
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-[11px] font-bold transition active:scale-95 cursor-pointer shadow-2xs"
              title="Copy order number"
              aria-label="Copy order number"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge status={order.status} />
            <span className="text-[11px] text-slate-400 font-medium">
              Placed at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {isCancellationLocked && !isDelivered && !isCancelled && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Cancellation is locked: food preparation is in progress with the kitchen and assigned rider.
          </span>
        </div>
      )}

      {isCancelled && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-semibold">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>
            Order cancelled: {order.cancellation_reason || 'cancellation confirmed'}
          </span>
        </div>
      )}

      {!isCancelled && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Live Delivery Progress
            </h2>
            {!isDelivered && (
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Polling</span>
              </div>
            )}
          </div>

          <div className="space-y-5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {TRACKING_STEPS.map((step, idx) => {
              const stepNum = idx + 1;
              const isPassed = currentStep >= stepNum;
              const isCurrent = currentStep === stepNum;

              return (
                <div key={step.key} className="relative flex items-start gap-3.5 pl-0.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black z-10 transition shrink-0 ${
                      isPassed
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-rose-600 text-white ring-4 ring-rose-100 animate-pulse'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPassed ? <CheckCircle className="w-3 h-3" /> : idx + 1}
                  </div>

                  <div className="space-y-0.5">
                    <h4
                      className={`text-xs font-bold ${
                        isPassed || isCurrent ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-snug">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.rider_id && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Assigned Rider
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {order.rider_id.user_id?.name || 'Speedy Rider'}
              </h3>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{order.rider_id.rating_avg > 0 ? order.rider_id.rating_avg.toFixed(1) : '5.0'}</span>
                <span>• {order.rider_id.vehicle_type || 'Motorcycle'}</span>
              </p>
            </div>
          </div>

          {order.rider_id.user_id?.phone_number && (
            <a
              href={`tel:${order.rider_id.user_id.phone_number}`}
              className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1 text-xs font-bold shrink-0"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call</span>
            </a>
          )}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        <div className="space-y-1 sm:pr-3">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <Store className="w-3 h-3 text-rose-500" />
            <span>Kitchen</span>
          </div>
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
            {order.restaurant_id?.name}
          </h4>
          <p className="text-[11px] text-slate-500">{order.restaurant_id?.address}</p>
        </div>

        <div className="space-y-1 pt-2 sm:pt-0 sm:pl-3">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <MapPin className="w-3 h-3 text-rose-500" />
            <span>Delivery Destination</span>
          </div>
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
            {order.customer_name} ({order.customer_phone})
          </h4>
          <p className="text-[11px] text-slate-500">{order.delivery_address_text}</p>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2.5">
            Order Items & Customizations
          </h3>

          <div className="divide-y divide-slate-100 space-y-2.5">
            {order.items.map((item: any, idx: number) => (
              <div key={idx} className="pt-2.5 first:pt-0 flex items-start justify-between gap-3">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-rose-600">
                      {item.quantity}x
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs truncate">
                      {item.name}
                    </h4>
                  </div>

                  {item.selected_variant && (
                    <p className="text-[11px] text-slate-500 pl-5">
                      <span className="font-medium">{item.selected_variant.group_title}:</span>{' '}
                      <span className="font-semibold text-slate-700">{item.selected_variant.option_name}</span>
                    </p>
                  )}

                  {item.selected_add_ons && item.selected_add_ons.length > 0 && (
                    <p className="text-[11px] text-slate-400 pl-5">
                      + {item.selected_add_ons.map((a: any) => a.name).join(', ')}
                    </p>
                  )}
                </div>

                <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                  ৳{item.total_price || item.unit_price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          {order.special_notes && order.special_notes.trim() && (
            <div className="pt-2.5 border-t border-slate-100 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                Special Instructions
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 italic">
                &ldquo;{order.special_notes.trim()}&rdquo;
              </p>
            </div>
          )}

          <div className="pt-2.5 border-t border-slate-100 space-y-1 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Food Subtotal</span>
              <span className="font-mono font-medium text-slate-900">৳{order.food_subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-mono font-medium text-slate-900">৳{order.delivery_fee}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span className="font-mono font-medium text-slate-900">৳{order.service_fee || 0}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 text-slate-900 font-bold text-sm">
              <span>Grand Total</span>
              <span className="font-mono font-black text-rose-600">৳{order.grand_total}</span>
            </div>
          </div>
        </div>
      )}

      {payment && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Payment Info
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                payment.status === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {payment.status === 'VERIFIED' ? 'Verified' : 'Pending Verification'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Method</span>
              <span className="font-bold text-slate-900">
                {payment.method === 'COD' ? 'Cash on Delivery' : payment.method}
              </span>
            </div>

            {payment.sender_number && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sender Number</span>
                <span className="font-mono font-medium text-slate-800">{payment.sender_number}</span>
              </div>
            )}

            {payment.transaction_id && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Transaction ID</span>
                <span className="font-mono font-medium text-slate-800 uppercase">{payment.transaction_id}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
              <span className="text-slate-500">Amount</span>
              <span className="font-mono font-black text-rose-600">৳{payment.amount}</span>
            </div>
          </div>
        </div>
      )}

      {isDelivered && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">How was your meal?</h3>
          </div>

          {reviewSubmitted ? (
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Thank you for reviewing! Your feedback helps our kitchens.</span>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit(onReviewSubmit)} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Food Rating (1-5 Stars)</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFoodRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= foodRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
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
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden"
              />

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
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
          className="w-full py-2.5 px-4 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition"
        >
          Cancel Order
        </button>
      )}

      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setCancelModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 space-y-3 shadow-2xl z-10">
            <h3 className="font-bold text-slate-900 text-sm">Cancel Order?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this order?
            </p>

            {cancelError && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                {cancelError}
              </div>
            )}

            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden"
            />

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
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
