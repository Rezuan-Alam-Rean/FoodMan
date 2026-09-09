// shopping cart and order customization state store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Restaurant, DiscountType } from '@/types';

export interface AppliedCouponInfo {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  discount_amount: number;
  restaurant_id: string;
}

interface CartState {
  restaurant: Restaurant | null;
  items: CartItem[];
  specialNotes: string;
  isCartOpen: boolean;
  appliedCoupon: AppliedCouponInfo | null;

  setRestaurant: (restaurant: Restaurant) => void;
  addItem: (item: CartItem, restaurant: Restaurant) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  setSpecialNotes: (notes: string) => void;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  toggleCart: () => void;
  applyCoupon: (coupon: AppliedCouponInfo) => void;
  removeCoupon: () => void;

  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant: null,
      items: [],
      specialNotes: '',
      isCartOpen: false,
      appliedCoupon: null,

      setRestaurant: (restaurant) => set({ restaurant }),

      addItem: (item, restaurant) => {
        const currentRest = get().restaurant;
        // if adding item from different restaurant, clear previous restaurant's items and coupon
        if (currentRest && (currentRest.id || currentRest._id) !== (restaurant.id || restaurant._id)) {
          set({
            restaurant,
            items: [item],
            specialNotes: '',
            appliedCoupon: null,
          });
          return;
        }

        const items = [...get().items];
        // check if identical item with same variant and addons already exists
        const existingIndex = items.findIndex(
          (i) =>
            i.food_item_id === item.food_item_id &&
            JSON.stringify(i.selected_variant) === JSON.stringify(item.selected_variant) &&
            JSON.stringify(i.selected_add_ons) === JSON.stringify(item.selected_add_ons)
        );

        if (existingIndex > -1) {
          const existing = items[existingIndex];
          const newQty = existing.quantity + item.quantity;
          items[existingIndex] = {
            ...existing,
            quantity: newQty,
            total_price: existing.unit_price * newQty,
          };
        } else {
          items.push(item);
        }

        set({
          restaurant,
          items,
        });
      },

      removeItem: (index) => {
        const items = get().items.filter((_, i) => i !== index);
        const isEmpty = items.length === 0;
        set({
          items,
          restaurant: isEmpty ? null : get().restaurant,
          appliedCoupon: isEmpty ? null : get().appliedCoupon,
        });
      },

      updateQuantity: (index, quantity) => {
        if (quantity <= 0) {
          get().removeItem(index);
          return;
        }

        const items = [...get().items];
        if (items[index]) {
          const item = items[index];
          items[index] = {
            ...item,
            quantity,
            total_price: item.unit_price * quantity,
          };
          set({ items });
        }
      },

      setSpecialNotes: (specialNotes) => set({ specialNotes }),

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),

      removeCoupon: () => set({ appliedCoupon: null }),

      clearCart: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('foodman_cart_storage');
        }
        set({
          restaurant: null,
          items: [],
          specialNotes: '',
          isCartOpen: false,
          appliedCoupon: null,
        });
      },

      setIsCartOpen: (isCartOpen) => set({ isCartOpen }),

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.total_price, 0);
      },

      getDiscountAmount: () => {
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        const subtotal = get().getSubtotal();
        if (subtotal < coupon.min_order_amount) return 0;

        if (coupon.discount_type === 'PERCENTAGE') {
          const raw = (subtotal * coupon.discount_value) / 100;
          const capped =
            typeof coupon.max_discount_amount === 'number' && coupon.max_discount_amount > 0
              ? Math.min(raw, coupon.max_discount_amount)
              : raw;
          return Math.min(Math.round(capped), subtotal);
        } else {
          return Math.min(coupon.discount_value, subtotal);
        }
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'foodman_cart_storage',
    }
  )
);
