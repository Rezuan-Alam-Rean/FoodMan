// shopping cart and order customization state store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Restaurant } from '@/types';

interface CartState {
  restaurant: Restaurant | null;
  items: CartItem[];
  specialNotes: string;
  isCartOpen: boolean;

  setRestaurant: (restaurant: Restaurant) => void;
  addItem: (item: CartItem, restaurant: Restaurant) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  setSpecialNotes: (notes: string) => void;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  toggleCart: () => void;

  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurant: null,
      items: [],
      specialNotes: '',
      isCartOpen: false,

      setRestaurant: (restaurant) => set({ restaurant }),

      addItem: (item, restaurant) => {
        const currentRest = get().restaurant;
        // if adding item from different restaurant, clear previous restaurant's items
        if (currentRest && currentRest.id !== restaurant.id) {
          set({
            restaurant,
            items: [item],
            specialNotes: '',
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
        set({
          items,
          restaurant: items.length === 0 ? null : get().restaurant,
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

      clearCart: () =>
        set({
          restaurant: null,
          items: [],
          specialNotes: '',
          isCartOpen: false,
        }),

      setIsCartOpen: (isCartOpen) => set({ isCartOpen }),

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.total_price, 0);
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
