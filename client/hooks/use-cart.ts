// cart and checkout pricing facade hook
'use client';

import { useMemo } from 'react';
import { useCartStore } from '@/lib/store/cart-store';
import { useZoneStore } from '@/lib/store/zone-store';
import type { CartItem, Restaurant } from '@/types';

export function useCart() {
  const cartStore = useCartStore();
  const zoneStore = useZoneStore();

  const subtotal = cartStore.getSubtotal();
  const itemCount = cartStore.getItemCount();
  const deliveryFee = zoneStore.getDeliveryFee();
  const serviceFee = itemCount > 0 ? 10 : 0; // fixed platform service fee
  const grandTotal = subtotal > 0 ? subtotal + deliveryFee + serviceFee : 0;

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
    grandTotal,

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

    setSelectedZone: zoneStore.setSelectedZone,
    setSelectedSubzone: zoneStore.setSelectedSubzone,
    setDetailedAddressText: zoneStore.setDetailedAddressText,
  };
}
