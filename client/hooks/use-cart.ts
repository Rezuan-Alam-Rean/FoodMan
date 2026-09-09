// cart and checkout pricing facade hook with coupon discount support
'use client';

import { useMemo } from 'react';
import { useCartStore } from '@/lib/store/cart-store';
import { useZoneStore } from '@/lib/store/zone-store';
import { useSystemSettingsQuery } from '@/hooks/queries/use-setting-queries';
import type { CartItem, Restaurant } from '@/types';

export function useCart() {
  const cartStore = useCartStore();
  const zoneStore = useZoneStore();
  const { data: settings, isLoading: isSettingsLoading } = useSystemSettingsQuery();

  const subtotal = cartStore.getSubtotal();
  const itemCount = cartStore.getItemCount();
  const deliveryFee = zoneStore.getDeliveryFee();
  const discountAmount = cartStore.getDiscountAmount();
  const hasLoadedSettings =
    typeof settings?.platform_service_fee === 'number' && settings.platform_service_fee >= 0;
  const configuredFee = hasLoadedSettings ? settings.platform_service_fee : 0;
  const serviceFee = itemCount > 0 ? (hasLoadedSettings ? configuredFee : 0) : 0;
  const grandTotal = subtotal > 0 ? Math.max(0, subtotal + deliveryFee + serviceFee - discountAmount) : 0;

  const isCartEmpty = cartStore.items.length === 0;

  const addItem = (item: CartItem, restaurant: Restaurant) => {
    cartStore.addItem(item, restaurant);
  };

  const removeItem = (index: number) => {
    cartStore.removeItem(index);
  };

  const updateQuantity = (index: number, quantity: number) => {
    cartStore.updateQuantity(index, quantity);
  };

  const clearCart = () => {
    cartStore.clearCart();
  };

  return {
    restaurant: cartStore.restaurant,
    items: cartStore.items,
    specialNotes: cartStore.specialNotes,
    isCartOpen: cartStore.isCartOpen,
    isCartEmpty,
    itemCount,

    subtotal,
    deliveryFee,
    serviceFee,
    discountAmount,
    appliedCoupon: cartStore.appliedCoupon,
    grandTotal,
    settings,
    isSettingsLoading,

    selectedZone: zoneStore.selectedZone,
    selectedSubzone: zoneStore.selectedSubzone,
    detailedAddressText: zoneStore.detailedAddressText,

    addItem,
    removeItem,
    updateQuantity,
    setSpecialNotes: cartStore.setSpecialNotes,
    clearCart,
    setIsCartOpen: cartStore.setIsCartOpen,
    toggleCart: cartStore.toggleCart,
    applyCoupon: cartStore.applyCoupon,
    removeCoupon: cartStore.removeCoupon,

    setSelectedZone: zoneStore.setSelectedZone,
    setSelectedSubzone: zoneStore.setSelectedSubzone,
    setDetailedAddressText: zoneStore.setDetailedAddressText,
  };
}
