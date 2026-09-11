// food item customization modal for selecting variants, add-ons, and quantity
'use client';

import React, { useState } from 'react';
import type { FoodItem, Restaurant, CartItem, CartItemOption, CartItemAddOn } from '@/types';
import { formatBDT, hasValidDiscount, getEffectivePrice, calculateDiscountPercentage } from '@/lib/utils';
import { X, Plus, Minus, Check, UtensilsCrossed, Sparkles } from 'lucide-react';

interface CustomizationModalProps {
  item: FoodItem | null;
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export function CustomizationModal({
  item,
  restaurant,
  isOpen,
  onClose,
  onAddToCart,
}: CustomizationModalProps) {
  if (!isOpen || !item) return null;

  const resolveOptionPricing = (option: { price: unknown; discount_price?: unknown }) => {
    const regular = Number(option.price);
    const regularPrice = Number.isFinite(regular) ? regular : item.base_price || 0;
    const hasDiscount = hasValidDiscount(regularPrice, option.discount_price as number | null | undefined);
    const effectivePrice = hasDiscount ? Number(option.discount_price) : regularPrice;
    const originalPrice = hasDiscount ? regularPrice : null;
    return { regularPrice, effectivePrice, originalPrice, hasDiscount };
  };

  // default to first variant if exists
  const firstOpt = item.variants?.[0]?.options?.[0];
  const firstOptPricing = firstOpt ? resolveOptionPricing(firstOpt) : null;
  const initialVariant: CartItemOption | null = firstOpt && firstOptPricing
    ? {
        group_title: item.variants[0].title,
        option_name: firstOpt.name,
        price: firstOptPricing.effectivePrice,
        original_price: firstOptPricing.originalPrice,
      }
    : null;

  const [selectedVariant, setSelectedVariant] = useState<CartItemOption | null>(initialVariant);
  const [selectedAddOns, setSelectedAddOns] = useState<CartItemAddOn[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  const isAvailable = item.is_available !== false;

  const itemBaseHasDiscount = hasValidDiscount(item.base_price, item.discount_price);
  const itemEffectiveBasePrice = getEffectivePrice(item.base_price, item.discount_price);
  const itemOriginalBasePrice = itemBaseHasDiscount ? item.base_price : null;

  // In absolute pricing, if a variant is selected, its price supersedes base_price.
  const activeBasePrice =
    selectedVariant != null && selectedVariant.price !== undefined
      ? selectedVariant.price
      : itemEffectiveBasePrice;

  const activeOriginalBasePrice =
    selectedVariant != null && selectedVariant.price !== undefined
      ? selectedVariant.original_price ?? null
      : itemOriginalBasePrice;

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = activeBasePrice + addOnsTotal;
  const originalUnitPrice = activeOriginalBasePrice !== null ? activeOriginalBasePrice + addOnsTotal : null;
  const totalPrice = unitPrice * quantity;

  const toggleAddOn = (addOn: { name: string; price: number }) => {
    if (!isAvailable) return;
    const exists = selectedAddOns.some((a) => a.name === addOn.name);
    if (exists) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addOn.name));
    } else {
      setSelectedAddOns([...selectedAddOns, { name: addOn.name, price: addOn.price }]);
    }
  };

  const handleConfirm = () => {
    if (!isAvailable) return;
    onAddToCart({
      food_item_id: item.id || item._id,
      name: item.name,
      base_price: activeBasePrice,
      unit_price: unitPrice,
      original_unit_price: originalUnitPrice,
      quantity,
      selected_variant: selectedVariant,
      selected_add_ons: selectedAddOns,
      total_price: totalPrice,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        <div className={`relative h-36 sm:h-44 bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center overflow-hidden shrink-0 border-b border-rose-600/30 ${!isAvailable ? 'grayscale-40' : ''}`}>
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white gap-2 p-3 sm:p-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md shadow-md ring-2 ring-white/20 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-rose-100">
                Fresh Gourmet Dish
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-11 h-11 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-slate-900/80 active:scale-[0.98] transition-transform z-20 cursor-pointer"
            title="Close"
            aria-label="Close customization"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1.5 z-10 flex-wrap max-w-[80%]">
            {!isAvailable && (
              <div className="bg-rose-600 text-white border border-rose-500/60 px-2 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>Out of Stock</span>
              </div>
            )}
            {item.is_vegetarian && (
              <div className="bg-emerald-600/90 backdrop-blur-xs text-white px-2 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
                Vegetarian
              </div>
            )}
          </div>
        </div>

        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-lg break-words">
                  {item.name}
                </h3>
                {!isAvailable && (
                  <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-md shrink-0">
                    View Only
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                {item.description || 'Prepared fresh with high quality ingredients.'}
              </p>
            </div>
            <div className="flex items-baseline gap-1.5 shrink-0">
              <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono">
                {formatBDT(unitPrice)}
              </span>
              {originalUnitPrice !== null && (
                <span className="text-xs font-semibold text-slate-400 line-through font-mono">
                  {formatBDT(originalUnitPrice)}
                </span>
              )}
            </div>
          </div>

          {!isAvailable && (
            <div className="mt-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-2">
              <span className="text-xs">⚠️</span>
              <span>This item is currently out of stock and cannot be ordered right now.</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-3">
              {item.variants.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {group.title}
                    </h4>
                    <span className="text-[10px] font-extrabold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                      Required
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map((option, optIdx) => {
                      const isSelected =
                        selectedVariant?.group_title === group.title &&
                        selectedVariant?.option_name === option.name;
                      const optPricing = resolveOptionPricing(option);
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() =>
                            setSelectedVariant({
                              group_title: group.title,
                              option_name: option.name,
                              price: optPricing.effectivePrice,
                              original_price: optPricing.originalPrice,
                            })
                          }
                          className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span>{option.name}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                              {formatBDT(optPricing.effectivePrice)}
                            </span>
                            {optPricing.hasDiscount && (
                              <span className="text-[10px] font-semibold text-slate-400 line-through font-mono">
                                {formatBDT(optPricing.regularPrice)}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {item.add_ons && item.add_ons.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Optional Add-ons
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {item.add_ons.map((addon, addIdx) => {
                  const isChecked = selectedAddOns.some((a) => a.name === addon.name);
                  return (
                    <button
                      key={addIdx}
                      type="button"
                      onClick={() => toggleAddOn(addon)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                        isChecked
                          ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isChecked ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        +{formatBDT(addon.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-850 flex items-center justify-between gap-3">
          {isAvailable ? (
            <>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform active:scale-[0.98] cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-base font-black text-slate-900 dark:text-white px-2.5 font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center transition-transform active:scale-[0.98] cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 min-h-[48px] py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-md shadow-rose-600/25 transition-all flex items-center justify-between active:scale-[0.98] cursor-pointer"
              >
                <span>Add to Cart</span>
                <span className="font-mono font-black">{formatBDT(totalPrice)}</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-300 transition cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                disabled
                className="flex-1 py-3 px-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-extrabold text-xs sm:text-sm flex items-center justify-between cursor-not-allowed opacity-90"
              >
                <span>Out of Stock</span>
                <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">Cannot Order</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
