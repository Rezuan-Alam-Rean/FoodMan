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
  ShieldCheck,
  User,
  Home,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    restaurant,
    items,
    subtotal,
    deliveryFee,
    serviceFee,
    grandTotal,
    specialNotes,
    clearCart,
    selectedZone,
    setSelectedZone,
    selectedSubzone,
    setSelectedSubzone,
  } = useCart();

  const { user, isAuthenticated } = useAuth();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { data: zones = [] } = useZonesQuery();
  const { data: addresses = [] } = useAddressesQuery(isAuthenticated);
  const createOrderMutation = useCreateOrderMutation();
  const [formError, setFormError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
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
  const watchedZoneId = watch('delivery_zone_id');
  const watchedSubzoneId = watch('delivery_subzone_id');
  const watchedSpecialNotes = watch('special_notes');

  const activeCheckoutZone =
    zones.find((z) => String(z.id || z._id) === String(watchedZoneId)) ||
    selectedZone ||
    zones[0];

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

    if (addresses.length > 0) {
      hasInitializedAddress.current = true;
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0];
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
      const firstZ = zones[0];
      setSelectedZone(firstZ);
      setValue('delivery_zone_id', String(firstZ.id || firstZ._id));
      if (firstZ.subzones && firstZ.subzones.length > 0) {
        setSelectedSubzone(firstZ.subzones[0]);
        setValue(
          'delivery_subzone_id',
          String(firstZ.subzones[0].id || firstZ.subzones[0]._id)
        );
      }
    }
  }, [addresses, zones, watchedZoneId, setValue, setSelectedZone, setSelectedSubzone]);

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

  const onSubmit = async (values: CheckoutFormValues) => {
    setFormError('');

    const targetZone = zones.find((z) => String(z.id || z._id) === values.delivery_zone_id);
    if (!targetZone) {
      setFormError('Please select a valid delivery zone');
      return;
    }
    const targetSubzone = targetZone.subzones?.find((s) => String(s.id || s._id) === values.delivery_subzone_id);
    if (!targetSubzone) {
      setFormError('Selected subzone does not belong to the selected delivery zone');
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
    <div className="space-y-4 sm:space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <Link
          href={`/restaurants/${restaurant?.slug || restaurant?.id || restaurant?._id || ''}`}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>
          <p className="text-xs text-slate-500">Ordering from <span className="font-bold text-rose-600">{restaurant?.name || 'Restaurant'}</span></p>
        </div>
      </div>

      {formError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <User className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Contact Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  {...register('customer_name')}
                  placeholder="e.g. Tanvir Ahmed"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden ${
                    errors.customer_name ? 'border-rose-500' : 'border-slate-200'
                  }`}
                />
                {errors.customer_name && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {errors.customer_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  {...register('customer_phone')}
                  placeholder="017XXXXXXXX"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden font-mono ${
                    errors.customer_phone ? 'border-rose-500' : 'border-slate-200'
                  }`}
                />
                {errors.customer_phone ? (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {errors.customer_phone.message}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    {isAuthenticated ? 'Authenticated Account' : 'Guest checkout auto-creates account'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Delivery Location</h3>
              </div>

              {isAuthenticated && addresses.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400">
                  {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
                </span>
              )}
            </div>

            {isAuthenticated && addresses.length > 0 && (
              <div className="space-y-1.5 pb-2 border-b border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select from Address Book
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {addresses.map((addr) => {
                    const addrId = addr.id || addr._id;
                    const isSelected = selectedAddressId === addrId;
                    const zoneName = typeof addr.zone_id === 'object' ? addr.zone_id?.name : 'Dhaka';
                    const subzoneName = typeof addr.subzone_id === 'object' ? addr.subzone_id?.name : '';

                    return (
                      <button
                        key={addrId}
                        type="button"
                        onClick={() => {
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
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between space-y-1 cursor-pointer ${
                          isSelected
                            ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-500 text-rose-800'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-900 text-white">
                              {addr.address_label || 'HOME'}
                            </span>
                            {addr.is_default && (
                              <span className="text-[9px] font-extrabold text-rose-600 bg-rose-100 px-1 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 truncate">
                            {zoneName}{subzoneName ? ` • ${subzoneName}` : ''}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold truncate">
                          {addr.detailed_address}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Zone *</label>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden cursor-pointer"
                >
                  {zones.map((z) => (
                    <option key={z.id || z._id} value={z.id || z._id} className="text-slate-900">
                      {z.name} (৳{z.fixed_delivery_fee} fee)
                    </option>
                  ))}
                </select>
                {errors.delivery_zone_id && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">
                    {errors.delivery_zone_id.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subzone (Area / Sector) *</label>
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
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden cursor-pointer ${
                    errors.delivery_subzone_id ? 'border-rose-500' : 'border-slate-200'
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Street Address *</label>
              <textarea
                rows={2}
                {...register('delivery_address_text')}
                placeholder="e.g. Flat 3A, House 12, Road 4, Section 10"
                className={`w-full px-3.5 py-2 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden resize-none ${
                  errors.delivery_address_text ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {errors.delivery_address_text && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1">
                  {errors.delivery_address_text.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cooking / Delivery Notes</label>
              <input
                type="text"
                {...register('special_notes')}
                placeholder="e.g. make it less spicy, call before knocking"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Payment Method</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('payment_method', 'COD')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-1.5 transition cursor-pointer ${
                  paymentMethod === 'COD'
                    ? 'border-rose-600 bg-rose-50/60 ring-1 ring-rose-600 text-rose-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-4 h-4 text-rose-600" />
                <div>
                  <div className="font-bold text-xs">Cash on Delivery</div>
                  <div className="text-[10px] text-slate-400">Pay cash upon delivery</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setValue('payment_method', 'BKASH')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between space-y-1.5 transition cursor-pointer ${
                  paymentMethod !== 'COD'
                    ? 'border-rose-600 bg-rose-50/60 ring-1 ring-rose-600 text-rose-700'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-4 h-4 text-rose-600" />
                <div>
                  <div className="font-bold text-xs">bKash / Nagad / MFS</div>
                  <div className="text-[10px] text-slate-400">Manual Send Money</div>
                </div>
              </button>
            </div>

            {paymentMethod !== 'COD' && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>FoodMan Official MFS: 01700-000000</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Send Money of <span className="font-bold text-rose-600">{formatBDT(checkoutGrandTotal)}</span> and enter your sender number & TxnID.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Your Sender Number *</label>
                    <input
                      type="text"
                      {...register('mfs_sender_number')}
                      placeholder="01XXXXXXXXX"
                      className={`w-full px-3 py-1.5 rounded-xl border bg-white text-xs font-mono focus:outline-hidden ${
                        errors.mfs_sender_number ? 'border-rose-500' : 'border-amber-300'
                      }`}
                    />
                    {errors.mfs_sender_number && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">
                        {errors.mfs_sender_number.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Transaction ID (TxnID) *</label>
                    <input
                      type="text"
                      {...register('mfs_transaction_id')}
                      placeholder="e.g. 9J28XA77"
                      className={`w-full px-3 py-1.5 rounded-xl border bg-white text-xs font-mono uppercase focus:outline-hidden ${
                        errors.mfs_transaction_id ? 'border-rose-500' : 'border-amber-300'
                      }`}
                    />
                    {errors.mfs_transaction_id && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">
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
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-xs sticky top-20">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
              Order Summary
            </h3>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100">
              {items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {item.quantity}x {item.name}
                    </div>
                    {item.selected_variant && (
                      <p className="text-[11px] text-slate-500 font-medium">
                        {item.selected_variant.group_title}: <span className="text-slate-700 font-semibold">{item.selected_variant.option_name}</span>
                      </p>
                    )}
                    {item.selected_add_ons && item.selected_add_ons.length > 0 && (
                      <p className="text-[11px] text-slate-400">
                        + {item.selected_add_ons.map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {formatBDT(item.total_price)}
                  </span>
                </div>
              ))}
            </div>

            {watchedSpecialNotes && watchedSpecialNotes.trim() && (
              <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                <span className="font-bold text-slate-500 text-[10px] uppercase tracking-wider block">
                  Special Notes / Instructions
                </span>
                <p className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100 italic">
                  &ldquo;{watchedSpecialNotes.trim()}&rdquo;
                </p>
              </div>
            )}

            <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Food Subtotal</span>
                <span className="font-bold text-slate-800">{formatBDT(subtotal)}</span>
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
                <span className="font-bold text-slate-800">{formatBDT(checkoutDeliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Service Fee</span>
                <span className="font-bold text-slate-800">{formatBDT(serviceFee)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                <span className="font-medium text-slate-600">Payment Method</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                  {paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Digital MFS (bKash/Nagad)'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total</span>
                <span className="text-rose-600 text-base">{formatBDT(checkoutGrandTotal)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={createOrderMutation.isPending}
              className="w-full py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition disabled:opacity-50 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {createOrderMutation.isPending ? (
                <span>Placing Your Order...</span>
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
