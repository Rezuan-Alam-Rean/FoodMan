// slide-over cart drawer with pricing breakdown and checkout trigger
'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { formatBDT } from '@/lib/utils';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Store, MapPin } from 'lucide-react';

export function CartDrawer() {
  const {
    restaurant,
    items,
    itemCount,
    subtotal,
    deliveryFee,
    serviceFee,
    grandTotal,
    selectedZone,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
            <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base">Your Cart</h2>
                <p className="text-xs text-slate-500">{itemCount} items</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

                    {restaurant && (
            <div className="px-4 py-2.5 bg-rose-50/70 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-rose-800 dark:text-rose-300 truncate">
                <Store className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate">{restaurant.name}</span>
              </div>
              <button
                onClick={clearCart}
                className="text-slate-400 hover:text-rose-600 text-xs font-semibold shrink-0 ml-2"
              >
                Clear
              </button>
            </div>
          )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-300">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-base">Your cart is empty</p>
                <p className="text-xs text-slate-400 mt-1">Add mouthwatering food from top restaurants</p>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={index} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                      {item.name}
                    </h4>

                                        {item.selected_variant && (
                      <p className="text-xs text-slate-500 font-medium">
                        {item.selected_variant.group_title}: {item.selected_variant.option_name}
                      </p>
                    )}

                                        {item.selected_add_ons && item.selected_add_ons.length > 0 && (
                      <p className="text-xs text-slate-400">
                        + {item.selected_add_ons.map((a) => a.name).join(', ')}
                      </p>
                    )}

                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1">
                      {formatBDT(item.total_price)}
                    </p>
                  </div>

                                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - 1)}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition"
                    >
                      {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-500" /> : <Minus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-bold text-slate-900 dark:text-white px-1">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + 1)}
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

                    {items.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Food Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatBDT(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  Delivery Fee ({selectedZone?.name || 'Zone Fixed'})
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatBDT(deliveryFee)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Platform Service Fee</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatBDT(serviceFee)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span className="text-rose-600 dark:text-rose-400 text-base">{formatBDT(grandTotal)}</span>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition active:scale-[0.99]"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
