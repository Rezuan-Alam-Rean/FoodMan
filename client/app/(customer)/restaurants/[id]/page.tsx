// restaurant details and menu page inspired by dribbble mobile detail design
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRestaurantDetailsQuery } from '@/hooks/queries/use-restaurant-queries';
import { useCart } from '@/hooks/use-cart';
import { CustomizationModal } from '@/components/cart/CustomizationModal';
import { formatBDT } from '@/lib/utils';
import type { FoodItem, MenuCategory, CartItem } from '@/types';
import {
  Star,
  MapPin,
  Plus,
  ArrowLeft,
  Store,
  Flame,
  UtensilsCrossed,
} from 'lucide-react';

export default function RestaurantPage() {
  const params = useParams();
  const idOrSlug = params.id as string;

  const { data, isLoading, isError } = useRestaurantDetailsQuery(idOrSlug);
  const { addItem, itemCount, grandTotal, restaurant: cartRestaurant } = useCart();

  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<FoodItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-56 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="h-8 bg-slate-200 rounded-xl w-2/3 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data?.restaurant) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-3">
        <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Kitchen not found</h2>
        <p className="text-xs text-slate-500">The restaurant is currently unavailable.</p>
        <Link href="/" className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs">
          Back to Explore
        </Link>
      </div>
    );
  }

  const { restaurant, menu } = data;
  const categories: MenuCategory[] = menu || [];
  const allItems: FoodItem[] = categories.flatMap((c) => c.items || []);

  const handleAddItemClick = (item: FoodItem) => {
    setSelectedItemForCustomization(item);
  };

  const filteredCategories = activeCategory
    ? categories.filter((c) => (c.id || c._id) === activeCategory)
    : categories;

  return (
    <div className="space-y-4 pb-20">
      <div className="relative h-56 rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center shadow-md border border-slate-200/50">
        {restaurant.cover_image_url ? (
          <img
            src={restaurant.cover_image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center text-white space-y-2 p-6 overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-600/30 ring-4 ring-white/10">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div className="text-center space-y-0.5 z-10">
              <h2 className="text-base font-black text-white tracking-tight">
                {restaurant.name}
              </h2>
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block">
                Authentic Kitchen
              </span>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 z-20">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-sm active:scale-95 transition hover:bg-white cursor-pointer"
            title="Back to Explore"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 space-y-4 border border-slate-200/70 shadow-xs">
        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {restaurant.name}
          </h1>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>{restaurant.address}</span>
          </p>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Hot & Fresh</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-900 border border-rose-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{restaurant.rating_avg > 0 ? restaurant.rating_avg.toFixed(1) : '5.0'}</span>
            </span>
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeCategory === ''
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Items ({allItems.length})
          </button>
          {categories.map((cat) => {
            const catId = cat.id || cat._id;
            return (
              <button
                key={catId}
                onClick={() => setActiveCategory(catId)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === catId
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        {filteredCategories.map((category) => {
          const catId = category.id || category._id;
          const items = category.items || [];
          if (items.length === 0) return null;

          return (
            <div key={catId} className="space-y-2.5">
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">{category.name}</h3>

              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => {
                  const itemId = item.id || item._id;

                  return (
                    <div
                      key={itemId}
                      onClick={() => handleAddItemClick(item)}
                      className="bg-white rounded-3xl border border-slate-200/80 p-3 flex flex-col justify-between space-y-2 shadow-xs hover:border-rose-300 hover:shadow-md transition cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <div className="h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center text-slate-400">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          ) : (
                            <UtensilsCrossed className="w-6 h-6 text-rose-400" />
                          )}
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-xs truncate pt-1 group-hover:text-rose-600 transition">
                          {item.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1 font-medium">{item.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="font-black text-rose-600 text-xs font-mono">{formatBDT(item.base_price)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddItemClick(item);
                          }}
                          className="w-7 h-7 rounded-xl bg-rose-50 group-hover:bg-rose-600 group-hover:text-white text-rose-600 flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {itemCount > 0 && cartRestaurant && (
        <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-30">
          <Link
            href="/cart"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between font-extrabold text-xs transition active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white text-rose-600 flex items-center justify-center text-[10px] font-black">
                {itemCount}
              </span>
              <span>View Cart Order</span>
            </div>
            <span className="text-sm font-black font-mono">{formatBDT(grandTotal)}</span>
          </Link>
        </div>
      )}

      {selectedItemForCustomization && (
        <CustomizationModal
          item={selectedItemForCustomization}
          restaurant={restaurant}
          isOpen={true}
          onClose={() => setSelectedItemForCustomization(null)}
          onAddToCart={(cartItem: CartItem) => {
            addItem(cartItem, restaurant);
            setSelectedItemForCustomization(null);
          }}
        />
      )}
    </div>
  );
}
