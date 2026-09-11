// guest and customer checkout page with react hook form and zod
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import { useAddressesQuery } from '@/hooks/queries/use-address-queries';
import { useCreateOrderMutation } from '@/hooks/queries/use-order-queries';
import {
  useValidateCouponMutation,
  useRestaurantCouponsQuery,
} from '@/hooks/queries/use-coupon-queries';
import { useAuthStore } from '@/lib/store/auth-store';
import { formatBDT } from '@/lib/utils';
import { checkoutSchema, type CheckoutFormValues } from '@/lib/validations/checkout';
import { SetPasswordModal } from '@/components/auth/SetPasswordModal';
import {
  MapPin,
  CreditCard,
  Banknote,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  User,
  Home,
  Briefcase,
  Sparkles,
  Copy,
  Check,
  Tag,
  Percent,
  X,
  Loader2,
} from 'lucide-react';
import { WhatsAppPhoneLink } from '@/components/ui/WhatsAppPhoneLink';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    restaurant,
    items,
    subtotal,
    deliveryFee,
    serviceFee,
    discountAmount,
    appliedCoupon,
    grandTotal,
    settings,
    isSettingsLoading,
    specialNotes,
    clearCart,
    applyCoupon,
    removeCoupon,
    selectedZone,
    setSelectedZone,
    selectedSubzone,
    setSelectedSubzone,
  } = useCart();

  const { user, isAuthenticated } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { data: zones = [], isSuccess: isZonesSuccess } = useZonesQuery({ refetchInterval: 10000 });
  const { data: addresses = [], isLoading: isAddressesLoading } = useAddressesQuery(isAuthenticated);
  const createOrderMutation = useCreateOrderMutation();
  const validateCouponMutation = useValidateCouponMutation();

  const currentRestaurantId = String(restaurant?.id || restaurant?._id || '');
  const { data: availableCoupons = [] } = useRestaurantCouponsQuery(
    currentRestaurantId,
    Boolean(currentRestaurantId)
  );

  const [formError, setFormError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [copiedMfs, setCopiedMfs] = useState(false);
  const [guestCompletedOrderId, setGuestCompletedOrderId] = useState<string | null>(null);
  const [isGuestPasswordModalOpen, setIsGuestPasswordModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: user?.name || '',
      customer_phone: user?.phone_number || '',
      delivery_zone_id: selectedZone?.id || selectedZone?._id || '',
      delivery_subzone_id: selectedSubzone?.id || selectedSubzone?._id || '',
      delivery_address_text: '',
      special_notes: specialNotes || '',
      payment_method: 'COD',
      mfs_sender_number: '',
      mfs_transaction_id: '',
    },
  });

  const paymentMethod = watch('payment_method');
  const isMfsActive = settings?.is_mfs_active !== false;

  // auto-reset payment method to COD if MFS is deactivated
  useEffect(() => {
    if (settings && settings.is_mfs_active === false && paymentMethod !== 'COD') {
      setValue('payment_method', 'COD');
    }
  }, [settings, paymentMethod, setValue]);
  const watchedZoneId = watch('delivery_zone_id');
  const watchedSubzoneId = watch('delivery_subzone_id');
  const watchedSpecialNotes = watch('special_notes');

  const activeCheckoutZone =
    zones.find((z) => String(z.id || z._id) === String(watchedZoneId)) ||
    selectedZone ||
    zones[0];

  const isZoneRiderAvailable = Boolean(
    activeCheckoutZone && activeCheckoutZone.has_active_riders === true
  );

  const activeCheckoutSubzone = (() => {
    const found = activeCheckoutZone?.subzones?.find(
      (s) => String(s.id || s._id) === String(watchedSubzoneId)
    );
    if (found) return found;
    if (
      selectedSubzone &&
      activeCheckoutZone?.subzones?.some(
        (s) => String(s.id || s._id) === String(selectedSubzone.id || selectedSubzone._id)
      )
    ) {
      return selectedSubzone;
    }
    return null;
  })();

  const checkoutDeliveryFee =
    activeCheckoutSubzone && activeCheckoutSubzone.custom_fixed_fee != null
      ? activeCheckoutSubzone.custom_fixed_fee
      : activeCheckoutZone?.fixed_delivery_fee ?? deliveryFee;

  const checkoutGrandTotal = subtotal > 0 ? subtotal + checkoutDeliveryFee + serviceFee : 0;

  // auto-select default address on initial load
  const hasInitializedAddress = React.useRef(false);
  useEffect(() => {
    if (hasInitializedAddress.current) return;
    if (!isZonesSuccess) return;
    if (isAuthenticated && isAddressesLoading) return;

    if (addresses.length > 0) {
      hasInitializedAddress.current = true;
      const getZoneForAddr = (addr: any) => {
        const zId = addr.zone_id
          ? String(
              typeof addr.zone_id === 'object'
                ? (addr.zone_id as any)._id || (addr.zone_id as any).id
                : addr.zone_id
            )
          : '';
        return zones.find((z) => String(z.id || z._id) === zId);
      };

      const isAddressRiderAvailable = (addr: any) => {
        const zone = getZoneForAddr(addr);
        return Boolean(zone && zone.has_active_riders === true);
      };

      const defaultAddr =
        addresses.find((a) => a.is_default && isAddressRiderAvailable(a)) ||
        addresses.find((a) => isAddressRiderAvailable(a)) ||
        addresses.find((a) => a.is_default) ||
        addresses[0];

      if (defaultAddr) {
        const addrId = defaultAddr.id || defaultAddr._id;
        setSelectedAddressId(addrId);
        setValue('delivery_address_text', defaultAddr.detailed_address);

        const zoneId = defaultAddr.zone_id
          ? String(
              typeof defaultAddr.zone_id === 'object'
                ? (defaultAddr.zone_id as any)._id || (defaultAddr.zone_id as any).id
                : defaultAddr.zone_id
            )
          : '';
        const subId = defaultAddr.subzone_id
          ? String(
              typeof defaultAddr.subzone_id === 'object'
                ? (defaultAddr.subzone_id as any)._id || (defaultAddr.subzone_id as any).id
                : defaultAddr.subzone_id
            )
          : '';

        if (zoneId) {
          setValue('delivery_zone_id', zoneId);
          const zoneObj = zones.find((z) => String(z.id || z._id) === zoneId);
          if (zoneObj) {
            setSelectedZone(zoneObj);
            if (subId) {
              const subObj = zoneObj.subzones?.find(
                (s) => String(s.id || s._id) === subId
              );
              if (subObj) setSelectedSubzone(subObj);
            }
          }
        }
        if (subId) {
          setValue('delivery_subzone_id', subId);
        }
      }
    } else if (zones.length > 0 && !watchedZoneId) {
      hasInitializedAddress.current = true;
      const firstActiveZone = zones.find((z) => z.has_active_riders === true) || zones[0];
      setSelectedZone(firstActiveZone);
      setValue('delivery_zone_id', String(firstActiveZone.id || firstActiveZone._id));
      if (firstActiveZone.subzones && firstActiveZone.subzones.length > 0) {
        setSelectedSubzone(firstActiveZone.subzones[0]);
        setValue(
          'delivery_subzone_id',
          String(firstActiveZone.subzones[0].id || firstActiveZone.subzones[0]._id)
        );
      }
    }
  }, [
    isZonesSuccess,
    isAddressesLoading,
    isAuthenticated,
    addresses,
    zones,
    watchedZoneId,
    setValue,
    setSelectedZone,
    setSelectedSubzone,
  ]);

  // sync user profile initial values if inputs are empty
  const hasInitializedUser = React.useRef(false);
  useEffect(() => {
    if (user && !hasInitializedUser.current) {
      hasInitializedUser.current = true;
      if (user.name) setValue('customer_name', user.name);
      if (user.phone_number) setValue('customer_phone', user.phone_number);
    }
  }, [user, setValue]);

  if ((items.length === 0 || !restaurant) && !guestCompletedOrderId) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Banknote className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Your cart is empty</h2>
        <p className="text-xs text-slate-500 max-w-sm">Please add delicious items from a restaurant before checking out.</p>
        <Link href="/" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition">
          Explore Restaurants
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await validateCouponMutation.mutateAsync({
        code,
        restaurant_id: currentRestaurantId,
        food_subtotal: subtotal,
      });

      if (res && res.valid) {
        applyCoupon({
          code: res.coupon.code,
          discount_type: res.coupon.discount_type,
          discount_value: res.coupon.discount_value,
          min_order_amount: res.coupon.min_order_amount,
          max_discount_amount: res.coupon.max_discount_amount,
          discount_amount: res.discount_amount,
          restaurant_id: currentRestaurantId,
        });
        setCouponSuccess(res.message || `Coupon "${res.coupon.code}" applied!`);
        setCouponInput('');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    }
  };

  const onSubmit = async (values: CheckoutFormValues) => {
    setFormError('');

    const targetZone = zones.find((z) => String(z.id || z._id) === values.delivery_zone_id);
    if (!targetZone) {
      setFormError('Please select a valid delivery zone');
      return;
    }
    if (!targetZone || targetZone.has_active_riders !== true) {
      setFormError('No delivery riders are currently active in the selected zone. Please choose a different delivery location.');
      return;
    }
    const targetSubzone = targetZone.subzones?.find((s) => String(s.id || s._id) === values.delivery_subzone_id);
    if (!targetSubzone) {
      setFormError('Selected subzone does not belong to the selected delivery zone');
      return;
    }
    if (values.payment_method !== 'COD' && settings?.is_mfs_active === false) {
      setFormError('Digital MFS payment is currently unavailable. Please select Cash on Delivery.');
      return;
    }

    try {
      const orderPayload = {
        customer_name: values.customer_name.trim(),
        customer_phone: values.customer_phone.trim(),
        delivery_zone_id: values.delivery_zone_id,
        delivery_subzone_id: values.delivery_subzone_id || null,
        delivery_address_text: values.delivery_address_text.trim(),
        special_notes: values.special_notes?.trim() || '',
        restaurant_id: (restaurant?.id || restaurant?._id)!,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        payment_method: values.payment_method,
        mfs_sender_number: values.payment_method !== 'COD' ? values.mfs_sender_number?.trim() : undefined,
        mfs_transaction_id: values.payment_method !== 'COD' ? values.mfs_transaction_id?.trim() : undefined,
        items: items.map((i) => ({
          food_item_id: i.food_item_id,
          name: i.name,
          quantity: i.quantity,
          selected_variant: i.selected_variant,
          selected_add_ons: i.selected_add_ons,
        })),
      };

      const res = await createOrderMutation.mutateAsync(orderPayload);
      clearCart();
      const orderId = res.order.id || res.order._id;

      // if guest auto registration returned a token, update auth store
      if (res.auth?.token && res.auth?.user) {
        setAuth(res.auth.token, res.auth.user);
        // prompt newly created guest to set password
        if (res.auth.user.has_password === false) {
          setGuestCompletedOrderId(orderId);
          setIsGuestPasswordModalOpen(true);
          return;
        }
      }

      router.push(`/orders/${orderId}`);
    } catch (err: any) {
      setFormError(err.message || 'failed to place order. please try again.');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-32 sm:pb-36">
      <div className="flex items-center gap-3">
        <Link
          href={`/restaurants/${restaurant?.slug || restaurant?.id || restaurant?._id || ''}`}
          className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs active:scale-95 cursor-pointer shrink-0"
          title="Back to restaurant"
          aria-label="Back to restaurant"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Checkout</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Ordering from <span className="font-bold text-rose-600">{restaurant?.name || 'Restaurant'}</span></p>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
                <User className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Contact Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Your Name *</label>
                <input
                  type="text"
                  {...register('customer_name')}
                  placeholder="e.g. Tanvir Ahmed"
                  className={`w-full h-12 px-4 rounded-2xl border bg-white dark:bg-slate-800 text-base sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition ${
                    errors.customer_name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.customer_name && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {errors.customer_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  {...register('customer_phone')}
                  placeholder="017XXXXXXXX"
                  className={`w-full h-12 px-4 rounded-2xl border bg-white dark:bg-slate-800 text-base sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition ${
                    errors.customer_phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.customer_phone ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {errors.customer_phone.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAuthenticated ? 'Authenticated Account' : 'Guest checkout auto-creates account'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Delivery Location</h3>
              </div>

              {isAuthenticated && addresses.length > 0 && (
                <span className="text-xs font-bold text-slate-400">
                  {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
                </span>
              )}
            </div>

            {isAuthenticated && addresses.length > 0 && (
              <div className="space-y-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Select from Address Book
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {addresses.map((addr) => {
                    const addrId = addr.id || addr._id;
                    const isSelected = selectedAddressId === addrId;
                    const zoneName = typeof addr.zone_id === 'object' ? addr.zone_id?.name : 'Dhaka';
                    const subzoneName = typeof addr.subzone_id === 'object' ? addr.subzone_id?.name : '';

                    const addrZoneId = addr.zone_id
                      ? String(typeof addr.zone_id === 'object' ? (addr.zone_id as any)._id || (addr.zone_id as any).id : addr.zone_id)
                      : '';
                    const addrZoneObj = zones.find((z) => String(z.id || z._id) === addrZoneId);
                    const isRiderOnline = Boolean(addrZoneObj && addrZoneObj.has_active_riders === true);

                    return (
                      <button
                        key={addrId}
                        type="button"
                        disabled={!isRiderOnline}
                        onClick={() => {
                          if (!isRiderOnline) return;
                          setSelectedAddressId(addrId);
                          setValue('delivery_address_text', addr.detailed_address, { shouldValidate: true });
                          const zoneId = addr.zone_id
                            ? String(typeof addr.zone_id === 'object' ? (addr.zone_id as any)._id || (addr.zone_id as any).id : addr.zone_id)
                            : '';
                          const subId = addr.subzone_id
                            ? String(typeof addr.subzone_id === 'object' ? (addr.subzone_id as any)._id || (addr.subzone_id as any).id : addr.subzone_id)
                            : '';

                          if (zoneId) {
                            setValue('delivery_zone_id', zoneId, { shouldValidate: true });
                            const zoneObj = zones.find((z) => String(z.id || z._id) === zoneId);
                            if (zoneObj) {
                              setSelectedZone(zoneObj);
                              if (subId) {
                                const subObj = zoneObj.subzones?.find((s) => String(s.id || s._id) === subId);
                                if (subObj) setSelectedSubzone(subObj);
                              }
                            }
                          }
                          if (subId) {
                            setValue('delivery_subzone_id', subId, { shouldValidate: true });
                          }
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-1.5 active:scale-[0.98] ${
                          !isRiderOnline
                            ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'
                            : isSelected
                            ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/30 ring-2 ring-rose-500 text-rose-900 dark:text-rose-100 cursor-pointer shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${!isRiderOnline ? 'bg-slate-300 text-slate-700' : 'bg-slate-900 text-white'}`}>
                              {addr.address_label || 'HOME'}
                            </span>
                            {addr.is_default && (
                              <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-md">
                                Default
                              </span>
                            )}
                            {!isRiderOnline && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                No Riders Online
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
                            {zoneName}{subzoneName ? ` • ${subzoneName}` : ''}
                          </span>
                        </div>
                        <p className="text-xs font-semibold truncate leading-relaxed">
                          {addr.detailed_address}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!isZoneRiderAvailable && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-amber-800 dark:text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">No Delivery Riders Currently Online</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
                    There are no active riders in <span className="font-semibold">{activeCheckoutZone?.name}</span> right now. Please select another delivery zone or address to place your order.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Delivery Zone *</label>
                <select
                  value={watchedZoneId || ''}
                  onChange={(e) => {
                    const newZoneId = e.target.value;
                    setValue('delivery_zone_id', newZoneId, { shouldValidate: true });
                    const zone = zones.find((z) => String(z.id || z._id) === String(newZoneId));
                    if (zone) {
                      setSelectedZone(zone);
                      let newSubId = '';
                      if (zone.subzones && zone.subzones.length > 0) {
                        const sub = zone.subzones[0];
                        setSelectedSubzone(sub);
                        newSubId = String(sub.id || sub._id);
                        setValue('delivery_subzone_id', newSubId, { shouldValidate: true });
                      } else {
                        setSelectedSubzone(null);
                        setValue('delivery_subzone_id', '', { shouldValidate: true });
                      }

                      // check if combo already exists in saved addresses
                      const matched = addresses.find((a) => {
                        const aZId = String(typeof a.zone_id === 'object' ? (a.zone_id as any)._id || (a.zone_id as any).id : a.zone_id);
                        const aSId = String(typeof a.subzone_id === 'object' ? (a.subzone_id as any)._id || (a.subzone_id as any).id : a.subzone_id);
                        return aZId === newZoneId && aSId === newSubId;
                      });
                      if (matched) {
                        setSelectedAddressId(matched.id || matched._id);
                        setValue('delivery_address_text', matched.detailed_address, { shouldValidate: true });
                      } else {
                        setSelectedAddressId(null);
                      }
                    }
                  }}
                  className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition cursor-pointer"
                >
                  {zones.map((z) => {
                    const isZoneActive = z.has_active_riders === true;
                    return (
                      <option
                        key={z.id || z._id}
                        value={z.id || z._id}
                        disabled={!isZoneActive}
                        className={!isZoneActive ? 'text-slate-400 bg-slate-100 italic' : 'text-slate-900'}
                      >
                        {z.name} {!isZoneActive ? '— (No Riders Online)' : `(৳${z.fixed_delivery_fee} fee)`}
                      </option>
                    );
                  })}
                </select>
                {errors.delivery_zone_id && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {errors.delivery_zone_id.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Subzone (Area / Sector) *</label>
                <select
                  value={watchedSubzoneId || ''}
                  onChange={(e) => {
                    const newSubId = e.target.value;
                    setValue('delivery_subzone_id', newSubId, { shouldValidate: true });
                    const sub = activeCheckoutZone?.subzones?.find((s) => String(s.id || s._id) === String(newSubId));
                    if (sub) setSelectedSubzone(sub);

                    // check if combo already exists in saved addresses
                    const currentZoneId = String(watchedZoneId || activeCheckoutZone?.id || activeCheckoutZone?._id || '');
                    const matched = addresses.find((a) => {
                      const aZId = String(typeof a.zone_id === 'object' ? (a.zone_id as any)._id || (a.zone_id as any).id : a.zone_id);
                      const aSId = String(typeof a.subzone_id === 'object' ? (a.subzone_id as any)._id || (a.subzone_id as any).id : a.subzone_id);
                      return aZId === currentZoneId && aSId === String(newSubId);
                    });
                    if (matched) {
                      setSelectedAddressId(matched.id || matched._id);
                      setValue('delivery_address_text', matched.detailed_address, { shouldValidate: true });
                    } else {
                      setSelectedAddressId(null);
                    }
                  }}
                  className={`w-full h-12 px-4 rounded-2xl border bg-white dark:bg-slate-800 text-base sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition cursor-pointer ${
                    errors.delivery_subzone_id ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {activeCheckoutZone?.subzones?.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id} className="text-slate-900">
                      {s.name} {s.custom_fixed_fee ? `(৳${s.custom_fixed_fee})` : ''}
                    </option>
                  ))}
                </select>
                {errors.delivery_subzone_id && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {errors.delivery_subzone_id.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Detailed Street Address *</label>
              <textarea
                rows={2}
                {...register('delivery_address_text')}
                placeholder="e.g. Flat 3A, House 12, Road 4, Section 10"
                className={`w-full px-4 py-3 rounded-2xl border bg-white dark:bg-slate-800 text-base sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition resize-none ${
                  errors.delivery_address_text ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.delivery_address_text && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  {errors.delivery_address_text.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Cooking / Delivery Notes</label>
              <input
                type="text"
                {...register('special_notes')}
                placeholder="e.g. make it less spicy, call before knocking"
                className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Payment Method</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('payment_method', 'COD')}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition cursor-pointer min-h-[80px] active:scale-[0.98] ${
                  paymentMethod === 'COD'
                    ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-rose-500 text-rose-900 dark:text-rose-100 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-5 h-5 text-rose-600" />
                <div>
                  <div className="font-bold text-xs sm:text-sm">Cash on Delivery</div>
                  <div className="text-[11px] text-slate-400">Pay cash upon delivery</div>
                </div>
              </button>

              {isMfsActive ? (
                <button
                  type="button"
                  onClick={() => setValue('payment_method', 'BKASH')}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition cursor-pointer min-h-[80px] active:scale-[0.98] ${
                    paymentMethod !== 'COD'
                      ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 ring-2 ring-rose-500 text-rose-900 dark:text-rose-100 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-rose-600" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm">{settings?.official_mfs_provider || 'bKash / Nagad / MFS'}</div>
                    <div className="text-[11px] text-slate-400 truncate">{settings?.official_mfs_instructions || 'Manual Send Money'}</div>
                  </div>
                </button>
              ) : (
                <div
                  className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-left flex flex-col justify-between space-y-2 opacity-60 cursor-not-allowed select-none min-h-[80px]"
                  title="Digital MFS payment is currently unavailable"
                >
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-500">{settings?.official_mfs_provider || 'Digital MFS'}</div>
                    <div className="text-[11px] text-slate-400 font-medium">Currently Offline</div>
                  </div>
                </div>
              )}
            </div>

            {isMfsActive && paymentMethod !== 'COD' && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap text-amber-900 dark:text-amber-200 text-xs font-bold">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>FoodMan Official MFS:</span>
                    <WhatsAppPhoneLink
                      phone={settings?.official_mfs_number || '01700-000000'}
                      className="font-mono text-amber-950 dark:text-amber-100 font-black bg-amber-200/80 dark:bg-amber-900/60 px-2 py-0.5 rounded-lg hover:bg-amber-300/80 transition"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(settings?.official_mfs_number || '01700-000000');
                        setCopiedMfs(true);
                        setTimeout(() => setCopiedMfs(false), 2000);
                      } catch {
                        // ignore clipboard write failure gracefully
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-200/80 hover:bg-amber-300/90 text-amber-950 transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                    title="Copy official MFS number"
                  >
                    {copiedMfs ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMfs ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Send Money of <span className="font-bold text-rose-600 font-mono">{formatBDT(checkoutGrandTotal)}</span> and enter your sender number & TxnID below.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Your Sender Number *</label>
                    <input
                      type="text"
                      {...register('mfs_sender_number')}
                      placeholder="01XXXXXXXXX"
                      className={`w-full h-12 px-4 rounded-2xl border bg-white dark:bg-slate-800 text-base sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 transition ${
                        errors.mfs_sender_number ? 'border-rose-500' : 'border-amber-300 dark:border-amber-800'
                      }`}
                    />
                    {errors.mfs_sender_number && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        {errors.mfs_sender_number.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Transaction ID (TxnID) *</label>
                    <input
                      type="text"
                      {...register('mfs_transaction_id')}
                      placeholder="e.g. 9J28XA77"
                      className={`w-full h-12 px-4 rounded-2xl border bg-white dark:bg-slate-800 text-base sm:text-sm font-mono uppercase focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 transition ${
                        errors.mfs_transaction_id ? 'border-rose-500' : 'border-amber-300 dark:border-amber-800'
                      }`}
                    />
                    {errors.mfs_transaction_id && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">
                        {errors.mfs_transaction_id.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
                <Tag className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Discount Coupon
              </h3>
            </div>

            {appliedCoupon ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                    %
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-black text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm tracking-wider">
                        {appliedCoupon.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                        {appliedCoupon.discount_type === 'PERCENTAGE'
                          ? `${appliedCoupon.discount_value}% OFF`
                          : `৳${appliedCoupon.discount_value} OFF`}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5 truncate">
                      Saving {formatBDT(discountAmount)} on this order
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    removeCoupon();
                    setCouponSuccess('');
                    setCouponError('');
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition cursor-pointer shrink-0 active:scale-90"
                  title="Remove coupon"
                  aria-label="Remove coupon"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError('');
                        setCouponSuccess('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      placeholder="Enter coupon code..."
                      className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base sm:text-sm font-bold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!couponInput.trim() || validateCouponMutation.isPending}
                    onClick={() => handleApplyCoupon()}
                    className="h-12 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-40 text-white text-xs sm:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs active:scale-95"
                  >
                    {validateCouponMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Apply</span>
                    )}
                  </button>
                </div>

                {couponError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{couponError}</span>
                  </p>
                )}

                {couponSuccess && (
                  <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{couponSuccess}</span>
                  </p>
                )}

                {availableCoupons.length > 0 && (
                  <div className="pt-1.5 space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Available Promos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableCoupons.map((c) => (
                        <button
                          key={c.id || c._id}
                          type="button"
                          onClick={() => handleApplyCoupon(c.code)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer group active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                          <span className="font-mono">{c.code}</span>
                          <span className="text-[10px] text-rose-500/80 font-normal">
                            ({c.discount_type === 'PERCENTAGE' ? `${c.discount_value}%` : `৳${c.discount_value}`} off)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3.5 shadow-xs sticky top-20">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5">
              Order Summary
            </h3>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((item, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 flex items-start justify-between text-xs sm:text-sm gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {item.quantity}x {item.name}
                    </div>
                    {item.selected_variant && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {item.selected_variant.group_title}: <span className="text-slate-700 dark:text-slate-200 font-semibold">{item.selected_variant.option_name}</span>
                      </p>
                    )}
                    {item.selected_add_ons && item.selected_add_ons.length > 0 && (
                      <p className="text-xs text-slate-400">
                        + {item.selected_add_ons.map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-slate-900 dark:text-white block">
                      {formatBDT(item.total_price)}
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

            {watchedSpecialNotes && watchedSpecialNotes.trim() && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider block">
                  Special Notes / Instructions
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 italic">
                  &ldquo;{watchedSpecialNotes.trim()}&rdquo;
                </p>
              </div>
            )}

            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Food Subtotal</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  Delivery Fee
                  {activeCheckoutSubzone?.name
                    ? ` (${activeCheckoutSubzone.name})`
                    : activeCheckoutZone?.name
                    ? ` (${activeCheckoutZone.name})`
                    : ''}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{formatBDT(checkoutDeliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Platform Service Fee</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {isSettingsLoading ? '...' : formatBDT(serviceFee)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <span className="flex items-center gap-1 font-bold text-xs">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Coupon ({appliedCoupon?.code})</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs sm:text-sm">- {formatBDT(discountAmount)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        removeCoupon();
                        setCouponSuccess('');
                        setCouponError('');
                      }}
                      className="text-emerald-500 hover:text-rose-600 transition cursor-pointer p-1"
                      title="Remove coupon"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-600 dark:text-slate-400">Payment Method</span>
                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-xs">
                  {paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Digital MFS (bKash/Nagad)'}
                </span>
              </div>
              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm sm:text-base font-black text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span className="text-rose-600 text-lg font-black font-mono">
                  {isSettingsLoading ? '...' : formatBDT(checkoutGrandTotal)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrderMutation.isPending || !isZoneRiderAvailable || isSettingsLoading}
              className="w-full min-h-[52px] py-4 px-5 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-600/25 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {createOrderMutation.isPending ? (
                <span>Placing Your Order...</span>
              ) : isSettingsLoading ? (
                <span>Loading Pricing...</span>
              ) : !isZoneRiderAvailable ? (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-200" />
                  No Riders Available in Zone
                </span>
              ) : (
                <>
                  <span>Confirm Order</span>
                  <span>• {formatBDT(checkoutGrandTotal)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <SetPasswordModal
        isOpen={isGuestPasswordModalOpen}
        onClose={() => {
          setIsGuestPasswordModalOpen(false);
          if (guestCompletedOrderId) {
            router.push(`/orders/${guestCompletedOrderId}`);
          }
        }}
        onSuccess={() => {
          setIsGuestPasswordModalOpen(false);
          if (guestCompletedOrderId) {
            router.push(`/orders/${guestCompletedOrderId}`);
          }
        }}
        isGuestPrompt={true}
      />
    </div>
  );
}
