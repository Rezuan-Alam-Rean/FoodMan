// restaurant details and menu page inspired by dribbble mobile detail design
'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useRestaurantDetailsQuery } from '@/hooks/queries/use-restaurant-queries';
import { useCart } from '@/hooks/use-cart';
import { CustomizationModal } from '@/components/cart/CustomizationModal';
import { formatBDT, hasValidDiscount } from '@/lib/utils';
import type { FoodItem, MenuCategory, CartItem } from '@/types';
import {
  Star,
  MapPin,
  Plus,
  ArrowLeft,
  Store,
  Flame,
  UtensilsCrossed,
  Search,
  ArrowUp,
  ArrowDown,
  Leaf,
  X,
  Eye,
} from 'lucide-react';

type SortOption = 'default' | 'price_asc' | 'price_desc';

export default function RestaurantPage() {
  const params = useParams();
  const idOrSlug = params.id as string;

  const { data, isLoading, isError } = useRestaurantDetailsQuery(idOrSlug);
  const { addItem, itemCount, grandTotal, restaurant: cartRestaurant } = useCart();

  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<FoodItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [isVegOnly, setIsVegOnly] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <div className="h-52 sm:h-60 bg-slate-200/80 rounded-3xl animate-pulse" />
        <div className="bg-white rounded-3xl p-5 border border-slate-200/60 space-y-3 animate-pulse">
          <div className="h-6 bg-slate-200 rounded-lg w-1/2 mx-auto" />
          <div className="h-4 bg-slate-100 rounded-md w-1/3 mx-auto" />
          <div className="h-10 bg-slate-100 rounded-2xl w-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-48 bg-slate-200/80 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data?.restaurant) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
          <Store className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900">Kitchen not found</h2>
          <p className="text-xs text-slate-500">The restaurant is currently unavailable or offline.</p>
        </div>
        <Link
          href="/"
          className="min-h-[44px] px-6 py-2.5 bg-rose-600 text-white font-bold rounded-2xl text-xs active:scale-[0.98] transition-transform shadow-md shadow-rose-500/20 inline-flex items-center"
        >
          Back to Explore
        </Link>
      </div>
    );
  }

  const { restaurant, menu } = data;

  // Process items per category based on search, filter, and sort
  const getItemPrice = (item: FoodItem) => {
    return hasValidDiscount(item.base_price, item.discount_price)
      ? Number(item.discount_price)
      : Number(item.base_price);
  };

  const categories: MenuCategory[] = (menu || []).map((c) => {
    let items = [...(c.items || [])];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    if (isVegOnly) {
      items = items.filter((item) => item.is_vegetarian);
    }

    if (sortBy === 'price_asc') {
      items = [...items].sort((a, b) => getItemPrice(a) - getItemPrice(b));
    } else if (sortBy === 'price_desc') {
      items = [...items].sort((a, b) => getItemPrice(b) - getItemPrice(a));
    }

    return {
      ...c,
      items,
    };
  });

  const allFilteredItems: FoodItem[] = categories.flatMap((c) => c.items || []);

  const handleAddItemClick = (item: FoodItem) => {
    setSelectedItemForCustomization(item);
  };

  const filteredCategories = activeCategory
    ? categories.filter((c) => (c.id || c._id) === activeCategory)
    : categories;

  const hasActiveFilters = searchQuery.trim() !== '' || sortBy !== 'default' || isVegOnly;

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('default');
    setIsVegOnly(false);
    setActiveCategory('');
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-36">
      <div className="relative h-52 sm:h-64 rounded-3xl overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 flex items-center justify-center shadow-sm border border-rose-200/50">
        {restaurant.cover_image_url ? (
          <img
            src={restaurant.cover_image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center text-white space-y-2.5 p-6 overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg ring-4 ring-white/20">
              <Store className="w-8 h-8 text-white" />
            </div>
            <div className="text-center space-y-0.5 z-10">
              <h2 className="text-xl font-black text-white tracking-tight">
                {restaurant.name}
              </h2>
              <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest block">
                Authentic Kitchen
              </span>
            </div>
          </div>
        )}

        <div className="absolute top-3.5 left-3.5 z-20">
          <Link
            href="/"
            className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-slate-800 shadow-md active:scale-[0.98] transition-transform hover:bg-white cursor-pointer"
            title="Back to Explore"
            aria-label="Back to Explore"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 sm:p-6 space-y-4 border border-slate-200/80 shadow-xs">
        <div className="text-center space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {restaurant.name}
          </h1>
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </p>

          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200/80 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Hot & Fresh</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-900 border border-rose-200/80 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <Star className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{restaurant.rating_avg > 0 ? restaurant.rating_avg.toFixed(1) : '5.0'}</span>
            </span>
          </div>
        </div>

        <div className="pt-3 space-y-3 border-t border-slate-100">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes in this menu..."
              className="w-full pl-11 pr-11 h-12 rounded-2xl bg-slate-50 text-base font-medium text-slate-800 placeholder:text-slate-400 border border-slate-200 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-[0.98] transition-transform cursor-pointer"
                aria-label="Clear search"
              >
                <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                  ✕
                </div>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSortBy('default')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-transform cursor-pointer active:scale-[0.98] ${
                  sortBy === 'default'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Default
              </button>
              <button
                onClick={() => setSortBy('price_asc')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-transform cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                  sortBy === 'price_asc'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Price: Low to High</span>
              </button>
              <button
                onClick={() => setSortBy('price_desc')}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-transform cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                  sortBy === 'price_desc'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Price: High to Low</span>
              </button>
              <button
                onClick={() => setIsVegOnly(!isVegOnly)}
                className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-transform cursor-pointer flex items-center gap-1.5 active:scale-[0.98] ${
                  isVegOnly
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>Veg Only</span>
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 min-h-[44px] flex items-center gap-1 bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100 active:scale-[0.98] transition-transform cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 snap-x snap-mandatory scroll-smooth pr-6">
          <button
            onClick={() => setActiveCategory('')}
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-transform cursor-pointer snap-start active:scale-[0.98] ${
              activeCategory === ''
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Items ({allFilteredItems.length})
          </button>
          {categories.map((cat) => {
            const catId = cat.id || cat._id;
            const catItemCount = cat.items?.length || 0;
            return (
              <button
                key={catId}
                onClick={() => setActiveCategory(catId)}
                className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-transform cursor-pointer snap-start active:scale-[0.98] ${
                  activeCategory === catId
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.name} ({catItemCount})
              </button>
            );
          })}
        </div>
      )}

      {allFilteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">No matching dishes</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try adjusting your search keywords, price sorting, or category filter.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="min-h-[44px] px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 active:scale-[0.98] transition-transform cursor-pointer inline-flex items-center gap-2 shadow-md shadow-rose-500/20"
            >
              <X className="w-4 h-4" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredCategories.map((category) => {
            const catId = category.id || category._id;
            const items = category.items || [];
            if (items.length === 0) return null;

            return (
              <div key={catId} className="space-y-3">
                <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight flex items-center justify-between">
                  <span>{category.name}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {items.map((item) => {
                    const itemId = item.id || item._id;
                    const isAvailable = item.is_available !== false;

                    return (
                      <div
                        key={itemId}
                        onClick={() => handleAddItemClick(item)}
                        className={`bg-white rounded-3xl border p-2.5 sm:p-3 flex flex-col justify-between space-y-2.5 shadow-xs transition-all duration-150 cursor-pointer group active:scale-[0.98] ${
                          isAvailable
                            ? 'border-slate-200/80 hover:border-rose-200 hover:shadow-md'
                            : 'border-slate-200/60 bg-slate-50/50 opacity-90'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className={`relative h-28 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center text-slate-400 ${!isAvailable ? 'grayscale-40' : ''}`}>
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-2xl bg-white shadow-md shadow-rose-500/15 flex items-center justify-center ring-2 ring-rose-100 group-hover:scale-105 transition">
                                <UtensilsCrossed className="w-5 h-5 text-rose-600" />
                              </div>
                            )}

                            {!isAvailable && (
                              <div className="absolute top-2 right-2 z-10 bg-slate-900/90 backdrop-blur-xs text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs">
                                Sold Out
                              </div>
                            )}

                            {item.is_vegetarian && (
                              <div className="absolute bottom-2 left-2 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs">
                                Veg
                              </div>
                            )}
                          </div>

                          <h4 className="font-black text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug pt-0.5 group-hover:text-rose-600 transition min-h-[32px] sm:min-h-[36px]">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 font-medium">{item.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 gap-1 border-t border-slate-100">
                          <div className="flex items-baseline gap-1 min-w-0 flex-wrap">
                            {hasValidDiscount(item.base_price, item.discount_price) ? (
                              <>
                                <span className="font-black text-rose-600 text-sm sm:text-base font-mono tracking-tight">
                                  {formatBDT(item.discount_price)}
                                </span>
                                <span className="text-xs font-semibold text-slate-400 line-through font-mono">
                                  {formatBDT(item.base_price)}
                                </span>
                              </>
                            ) : (
                              <span className="font-black text-rose-600 text-sm sm:text-base font-mono tracking-tight">
                                {formatBDT(item.base_price)}
                              </span>
                            )}
                          </div>

                          {isAvailable ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddItemClick(item);
                              }}
                              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-rose-50 group-hover:bg-rose-600 group-hover:text-white text-rose-600 flex items-center justify-center transition-transform active:scale-[0.98] shadow-2xs cursor-pointer shrink-0"
                              title="Add to cart"
                              aria-label={`Add ${item.name} to cart`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddItemClick(item);
                              }}
                              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 group-hover:bg-slate-200 text-slate-600 flex items-center gap-1 text-xs font-bold transition-transform active:scale-[0.98] shadow-2xs cursor-pointer shrink-0"
                              title="View Details (Out of Stock)"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {itemCount > 0 && cartRestaurant && (
        <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-30 animate-in slide-in-from-bottom-3 duration-200">
          <Link
            href="/cart"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white min-h-[52px] px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between font-bold text-xs sm:text-sm transition-transform active:scale-[0.98] cursor-pointer border border-rose-500/50 backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-white text-rose-600 flex items-center justify-center text-xs font-black shadow-xs">
                {itemCount}
              </span>
              <span>View Cart Order</span>
            </div>
            <span className="text-sm sm:text-base font-black font-mono">{formatBDT(grandTotal)}</span>
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
