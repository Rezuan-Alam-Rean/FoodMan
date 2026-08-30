// food item customization modal for selecting variants, add-ons, and quantity
'use client';

import React, { useState } from 'react';
import type { FoodItem, Restaurant, CartItem, CartItemOption, CartItemAddOn } from '@/types';
import { formatBDT } from '@/lib/utils';
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

  // default to first variant if exists
  const initialVariant = item.variants?.[0]?.options?.[0]
    ? {
        group_title: item.variants[0].title,
        option_name: item.variants[0].options[0].name,
        price_delta: item.variants[0].options[0].price_delta || 0,
      }
    : null;

  const [selectedVariant, setSelectedVariant] = useState<CartItemOption | null>(initialVariant);
  const [selectedAddOns, setSelectedAddOns] = useState<CartItemAddOn[]>([]);
  const [quantity, setQuantity] = useState<number>(1);

  const basePrice = item.base_price || 0;
  const variantDelta = selectedVariant?.price_delta || 0;
  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + variantDelta + addOnsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleAddOn = (addOn: { name: string; price: number }) => {
    const exists = selectedAddOns.some((a) => a.name === addOn.name);
    if (exists) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addOn.name));
    } else {
      setSelectedAddOns([...selectedAddOns, { name: addOn.name, price: addOn.price }]);
    }
  };

  const handleConfirm = () => {
    onAddToCart({
      food_item_id: item.id || item._id,
      name: item.name,
      base_price: item.base_price,
      unit_price: unitPrice,
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

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        <div className="relative h-44 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center overflow-hidden shrink-0 border-b border-slate-800">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/90 gap-1.5 p-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 shadow-md shadow-rose-600/30 ring-2 ring-white/10 flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">
                Fresh Gourmet Dish
              </span>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-slate-900/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-slate-900/80 transition active:scale-95 z-20 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {item.is_vegetarian && (
            <div className="absolute bottom-3 left-3 bg-emerald-600/90 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-xs">
              Vegetarian
            </div>
          )}
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                {item.description || 'Prepared fresh with high quality ingredients.'}
              </p>
            </div>
            <span className="text-base font-black text-rose-600 dark:text-rose-400 font-mono shrink-0">
              {formatBDT(item.base_price)}
            </span>
          </div>
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
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() =>
                            setSelectedVariant({
                              group_title: group.title,
                              option_name: option.name,
                              price_delta: option.price_delta || 0,
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
                          <span className="text-xs font-bold text-slate-500">
                            {option.price_delta > 0 ? `+${formatBDT(option.price_delta)}` : 'Included'}
                          </span>
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
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-2xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-black text-slate-900 dark:text-white px-2 font-mono">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-600/25 transition flex items-center justify-between active:scale-[0.99] cursor-pointer"
          >
            <span>Add to Cart</span>
            <span className="font-mono font-black">{formatBDT(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
