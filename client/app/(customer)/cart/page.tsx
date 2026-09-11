// dedicated customer cart page with full order breakdown, quantity controls, and checkout trigger
'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { formatBDT } from '@/lib/utils';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Store,
  MapPin,
  UtensilsCrossed,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export default function CartPage() {
  const {
    restaurant,
    items,
    itemCount,
    subtotal,
    deliveryFee,
    serviceFee,
    grandTotal,
    selectedZone,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const restaurantId = restaurant?.id || restaurant?._id || '';

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-100 to-rose-50 dark:from-rose-950/40 dark:to-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-md">
            0
          </div>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Your cart is empty
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Explore authentic feasts, biryani, burgers, and delicious dishes from top restaurants.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer"
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Browse Restaurants</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-32 sm:pb-36 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href={restaurantId ? `/restaurants/${restaurantId}` : '/'}
            className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition shadow-xs active:scale-95 cursor-pointer"
            title="Back to menu"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Review Cart
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your order
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-bold text-slate-400 hover:text-rose-600 transition px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 cursor-pointer"
        >
          Clear Cart
        </button>
      </div>

      {restaurant && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {restaurant.name}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {restaurant.address || 'Dhaka'}
              </p>
            </div>
          </div>

          <Link
            href={`/restaurants/${restaurantId}`}
            className="inline-flex items-center px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs font-bold text-rose-600 hover:text-rose-700 shrink-0 ml-2 hover:bg-rose-100 transition active:scale-95 cursor-pointer"
          >
            + Add more
          </Link>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800/80 shadow-xs space-y-3.5">
        {items.map((item, index) => (
          <div key={index} className="pt-3.5 first:pt-0 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug truncate">
                {item.name}
              </h3>

              {item.selected_variant && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {item.selected_variant.group_title}: <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.selected_variant.option_name}</span>
                </p>
              )}

              {item.selected_add_ons && item.selected_add_ons.length > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  + {item.selected_add_ons.map((a) => a.name).join(', ')}
                </p>
              )}

              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                  {formatBDT(item.total_price)}
                </span>
                {item.original_unit_price && item.original_unit_price > item.unit_price && (
                  <span className="text-xs text-slate-400 line-through font-mono">
                    {formatBDT(item.original_unit_price * item.quantity)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => updateQuantity(index, item.quantity - 1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-600 transition shadow-xs active:scale-90 cursor-pointer"
                title={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
                aria-label={item.quantity === 1 ? 'Remove item' : 'Decrease quantity'}
              >
                {item.quantity === 1 ? (
                  <Trash2 className="w-4 h-4 text-rose-500" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
              </button>

              <span className="w-8 text-center text-sm font-black text-slate-900 dark:text-white font-mono">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={() => updateQuantity(index, item.quantity + 1)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-rose-600 transition shadow-xs active:scale-90 cursor-pointer"
                title="Increase quantity"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3 shadow-xs">
        <h4 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
          Bill Details
        </h4>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
          <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Food Subtotal</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {formatBDT(subtotal)}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Delivery Fee ({selectedZone?.name || 'Dhaka Zone'})</span>
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {formatBDT(deliveryFee)}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span>Platform Service Fee</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {formatBDT(serviceFee)}
            </span>
          </div>

          <div className="pt-3.5 flex items-center justify-between text-sm sm:text-base font-black text-slate-900 dark:text-white">
            <span>Grand Total</span>
            <span className="text-lg font-black text-rose-600 font-mono">
              {formatBDT(grandTotal)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Fixed zone delivery rate guaranteed by FoodMan.</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="w-full min-h-[52px] py-4 px-5 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-extrabold text-sm shadow-lg shadow-rose-600/25 flex items-center justify-between transition active:scale-[0.98] cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </div>
        <span className="font-black font-mono text-base">{formatBDT(grandTotal)}</span>
      </Link>
    </div>
  );
}
