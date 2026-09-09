// customer discovery feed with foods and kitchens tabs and infinite scroll
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useInfiniteFoodItemsQuery, useCategoriesQuery } from '@/hooks/queries/use-menu-queries';
import { useInfiniteRestaurantsQuery } from '@/hooks/queries/use-restaurant-queries';
import { useZoneStore } from '@/lib/store/zone-store';
import { formatBDT, hasValidDiscount } from '@/lib/utils';
import {
  Search,
  Star,
  MapPin,
  Store,
  Sparkles,
  UtensilsCrossed,
  Flame,
  Loader2,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Leaf,
  X,
  Check,
} from 'lucide-react';
import type { Restaurant } from '@/types';

// icon helper for dynamic category badges
const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('kacchi')) return '🍖';
  if (lower.includes('biryani')) return '🍲';
  if (lower.includes('burger')) return '🍔';
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('sushi') || lower.includes('asian')) return '🍣';
  if (lower.includes('fast')) return '🍟';
  if (lower.includes('dessert') || lower.includes('sweet') || lower.includes('firni')) return '🍰';
  if (lower.includes('beverage') || lower.includes('drink') || lower.includes('borhani')) return '🥤';
  if (lower.includes('kebab')) return '🍢';
  if (lower.includes('bengali')) return '🍛';
  return '🍽️';
};

type SortOption = 'newest' | 'price_asc' | 'price_desc';
type PriceFilter = 'all' | 'under_200' | '200_500' | 'above_500';

export default function CustomerHomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [activeTab, setActiveTab] = useState<'FOODS' | 'KITCHENS'>('FOODS');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { selectedZone } = useZoneStore();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // query categories for horizontal filter
  const { data: categories = [] } = useCategoriesQuery({ is_active: true });

  // calculate price bounds
  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  if (priceFilter === 'under_200') {
    maxPrice = 200;
  } else if (priceFilter === '200_500') {
    minPrice = 200;
    maxPrice = 500;
  } else if (priceFilter === 'above_500') {
    minPrice = 500;
  }

  // infinite query for available food items
  const {
    data: foodsData,
    isLoading: isFoodsLoading,
    isFetchingNextPage: isFetchingNextFoods,
    hasNextPage: hasNextFoods,
    fetchNextPage: fetchNextFoods,
  } = useInfiniteFoodItemsQuery({
    category_id: selectedCategoryId || undefined,
    search: searchTerm || undefined,
    sort_by: sortBy,
    min_price: minPrice,
    max_price: maxPrice,
    is_vegetarian: isVegOnly ? true : undefined,
  });

  // infinite query for active restaurants
  const {
    data: kitchensData,
    isLoading: isKitchensLoading,
    isFetchingNextPage: isFetchingNextKitchens,
    hasNextPage: hasNextKitchens,
    fetchNextPage: fetchNextKitchens,
  } = useInfiniteRestaurantsQuery({
    search: searchTerm || undefined,
    is_open: true,
  });

  // flatten infinite pages
  const allFoods = foodsData?.pages.flatMap((page) => page.items) || [];
  const allKitchens = kitchensData?.pages.flatMap((page) => page.restaurants) || [];

  const activeFilterCount =
    (sortBy !== 'newest' ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    (isVegOnly ? 1 : 0) +
    (selectedCategoryId ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setSortBy('newest');
    setPriceFilter('all');
    setIsVegOnly(false);
    setSelectedCategoryId('');
    setSearchTerm('');
  };

  // scroll-based infinite pagination observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          if (activeTab === 'FOODS' && hasNextFoods && !isFetchingNextFoods) {
            fetchNextFoods();
          } else if (activeTab === 'KITCHENS' && hasNextKitchens && !isFetchingNextKitchens) {
            fetchNextKitchens();
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [
    activeTab,
    hasNextFoods,
    isFetchingNextFoods,
    fetchNextFoods,
    hasNextKitchens,
    isFetchingNextKitchens,
    fetchNextKitchens,
  ]);

  const deliveryFee = selectedZone?.fixed_delivery_fee || 100;

  return (
    <div className="space-y-4">
      <div className="relative rounded-3xl bg-gradient-to-br from-rose-50/90 via-orange-50/50 to-amber-50/70 p-5 space-y-3.5 border border-rose-100/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
              FoodMan
            </span>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Delicious Recipes
            </h1>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-500 border border-rose-100/70 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'FOODS'
                ? 'Search delicious dishes, kacchi, burgers...'
                : 'Search favorite restaurants and kitchens...'
            }
            className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 border border-rose-100 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-rose-200 focus:border-rose-300 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              setSelectedCategoryId('');
              setActiveTab('FOODS');
            }}
            className={`flex flex-col items-center justify-start gap-1.5 p-2 rounded-2xl w-[72px] min-w-[72px] sm:w-[76px] sm:min-w-[76px] transition cursor-pointer border shrink-0 ${
              !selectedCategoryId && activeTab === 'FOODS'
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-inner shrink-0">
              🍽️
            </div>
            <span className="text-[10px] font-bold tracking-tight text-center leading-tight line-clamp-2 break-words w-full h-6 flex items-center justify-center">
              All
            </span>
          </button>

          {categories.map((cat) => {
            const catId = cat.id || cat._id;
            const isSelected = selectedCategoryId === catId && activeTab === 'FOODS';
            return (
              <button
                key={catId}
                onClick={() => {
                  setSelectedCategoryId(catId);
                  setActiveTab('FOODS');
                }}
                className={`flex flex-col items-center justify-start gap-1.5 p-2 rounded-2xl w-[72px] min-w-[72px] sm:w-[76px] sm:min-w-[76px] transition cursor-pointer border shrink-0 ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-inner shrink-0">
                  {cat.emoji || getCategoryIcon(cat.name)}
                </div>
                <span className="text-[10px] font-bold tracking-tight text-center leading-tight line-clamp-2 break-words w-full h-6 flex items-center justify-center">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-center text-xs font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('FOODS')}
            className={`pb-2.5 px-4 relative transition cursor-pointer ${
              activeTab === 'FOODS'
                ? 'text-rose-600 font-extrabold after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-rose-600 after:rounded-full'
                : 'hover:text-slate-900'
            }`}
          >
            Foods
          </button>
          <button
            onClick={() => setActiveTab('KITCHENS')}
            className={`pb-2.5 px-4 relative transition cursor-pointer ${
              activeTab === 'KITCHENS'
                ? 'text-rose-600 font-extrabold after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-rose-600 after:rounded-full'
                : 'hover:text-slate-900'
            }`}
          >
            Kitchens
          </button>
        </div>

        {activeTab === 'FOODS' && (
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1 mb-1.5 rounded-full text-[11px] font-bold transition cursor-pointer border ${
              showFilterMenu || activeFilterCount > 0
                ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Sort & Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Sort and Filter Panel for Foods */}
      {activeTab === 'FOODS' && (
        <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-rose-500" />
              <span>Sort by Price:</span>
            </span>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5 bg-rose-50 px-2 py-0.5 rounded-md hover:bg-rose-100 transition cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset all</span>
              </button>
            )}
          </div>

          {/* Quick Sort Pills (Responsive flex-wrap) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                sortBy === 'newest'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <span>⚡ Popular / Newest</span>
            </button>

            <button
              onClick={() => setSortBy('price_asc')}
              className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                sortBy === 'price_asc'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <ArrowUp className="w-3 h-3" />
              <span>Price: Low to High</span>
            </button>

            <button
              onClick={() => setSortBy('price_desc')}
              className={`flex-1 sm:flex-none justify-center px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                sortBy === 'price_desc'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <ArrowDown className="w-3 h-3" />
              <span>Price: High to Low</span>
            </button>
          </div>

          {/* Additional Filter Chips: Veg & Price Ranges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsVegOnly(!isVegOnly)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                isVegOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Leaf className="w-2.5 h-2.5" />
              <span>Veg Only</span>
            </button>

            <button
              onClick={() => setPriceFilter(priceFilter === 'under_200' ? 'all' : 'under_200')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                priceFilter === 'under_200'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Under ৳200
            </button>

            <button
              onClick={() => setPriceFilter(priceFilter === '200_500' ? 'all' : '200_500')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                priceFilter === '200_500'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ৳200 - ৳500
            </button>

            <button
              onClick={() => setPriceFilter(priceFilter === 'above_500' ? 'all' : 'above_500')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                priceFilter === 'above_500'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ৳500+
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>
                {activeTab === 'FOODS'
                  ? selectedCategoryId
                    ? `Category: ${categories.find((c) => (c.id || c._id) === selectedCategoryId)?.name || 'Items'}`
                    : 'Popular Foods'
                  : 'Featured Kitchens'}
              </span>
            </h2>
            {activeTab === 'FOODS' && sortBy !== 'newest' && (
              <p className="text-[10px] font-semibold text-rose-600">
                Sorted by {sortBy === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
              </p>
            )}
          </div>
          {selectedZone && (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              {selectedZone.name} • ৳{selectedZone.fixed_delivery_fee}
            </span>
          )}
        </div>

        {activeTab === 'FOODS' ? (
          isFoodsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-3 space-y-2 border border-slate-100 animate-pulse">
                  <div className="h-28 bg-slate-200 rounded-2xl" />
                  <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : allFoods.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-xs">No food items found</h3>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {activeFilterCount > 0
                    ? 'No dishes match your active search and filter criteria.'
                    : selectedCategoryId
                    ? 'No available items in this category.'
                    : 'Try changing your search keywords.'}
                </p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-3.5 py-1.5 bg-rose-600 text-white rounded-full text-xs font-bold hover:bg-rose-700 transition cursor-pointer inline-flex items-center gap-1 shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {allFoods.map((item) => {
                const restObj = typeof item.restaurant_id === 'object' ? (item.restaurant_id as Restaurant) : null;
                const restSlug = restObj?.slug || restObj?._id || restObj?.id || item.restaurant_id;
                const restName = restObj?.name || 'Kitchen';
                const restRating = restObj?.rating_avg || 4.8;
                const isAvailable = item.is_available !== false;

                return (
                  <Link
                    key={item.id || item._id}
                    href={`/restaurants/${restSlug}`}
                    className={`group bg-white rounded-3xl border p-2 sm:p-2.5 flex flex-col justify-between space-y-2 shadow-xs transition active:scale-[0.98] ${
                      isAvailable
                        ? 'border-slate-200/70 hover:shadow-md'
                        : 'border-slate-200/50 bg-slate-50/40 hover:border-slate-300'
                    }`}
                  >
                    <div className={`relative h-28 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center border border-slate-800/40 ${!isAvailable ? 'grayscale-40 opacity-90' : ''}`}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center text-white/90 gap-1.5 p-2 overflow-hidden">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 shadow-md shadow-rose-600/30 flex items-center justify-center ring-2 ring-white/10 group-hover:scale-105 transition">
                            <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-rose-300">
                            Fresh Dish
                          </span>
                        </div>
                      )}

                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white border border-white/10 shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{restRating > 0 ? restRating.toFixed(1) : '5.0'}</span>
                        </span>
                      </div>

                      {!isAvailable && (
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider bg-slate-900/90 text-rose-300 border border-rose-500/40 shadow-xs">
                            Out of Stock
                          </span>
                        </div>
                      )}

                      {item.is_vegetarian && (
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10 bg-emerald-600/90 backdrop-blur-xs text-white px-1.5 sm:px-2 py-0.5 rounded-md text-[7px] sm:text-[8px] font-black uppercase tracking-wider">
                          Veg
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 px-0.5 sm:px-1 flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-rose-600 transition">
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 line-clamp-1 font-medium mt-0.5 flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{restName}</span>
                        </p>
                      </div>

                      <div className="pt-1.5 sm:pt-2 flex items-center justify-between gap-1">
                        <div className="flex items-baseline gap-1 min-w-0 flex-wrap">
                          {hasValidDiscount(item.base_price, item.discount_price) ? (
                            <>
                              <span className="text-xs font-black text-rose-600 font-mono">
                                {formatBDT(item.discount_price)}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400 line-through font-mono">
                                {formatBDT(item.base_price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs font-black text-rose-600 font-mono">
                              {formatBDT(item.base_price)}
                            </span>
                          )}
                        </div>
                        {isAvailable ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-slate-500 group-hover:text-rose-600 transition shrink-0">
                            Order <ChevronRight className="w-3 h-3 ml-0.5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition shrink-0">
                            View <ChevronRight className="w-3 h-3 ml-0.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          isKitchensLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-3 space-y-2 border border-slate-100 animate-pulse">
                  <div className="h-28 bg-slate-200 rounded-2xl" />
                  <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : allKitchens.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-xs">No kitchens available</h3>
              <p className="text-[11px] text-slate-400">Try resetting your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {allKitchens.map((restaurant) => {
                const restId = restaurant.id || restaurant._id;
                return (
                  <Link
                    key={restId}
                    href={`/restaurants/${restaurant.slug || restId}`}
                    className="group bg-white rounded-3xl border border-slate-200/70 p-2 sm:p-2.5 flex flex-col space-y-2 shadow-xs hover:shadow-md transition active:scale-[0.98]"
                  >
                    <div className="relative h-28 sm:h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center border border-slate-800/40">
                      {restaurant.cover_image_url ? (
                        <img
                          src={restaurant.cover_image_url}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center text-white/90 gap-1.5 p-2 overflow-hidden">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 shadow-md shadow-rose-600/30 flex items-center justify-center ring-2 ring-white/10 group-hover:scale-105 transition">
                            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-rose-300">
                            Authentic Kitchen
                          </span>
                        </div>
                      )}

                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white border border-white/10 shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{restaurant.rating_avg > 0 ? restaurant.rating_avg.toFixed(1) : '5.0'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 px-0.5 sm:px-1 min-w-0">
                      <h3 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-rose-600 transition">
                        {restaurant.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-1 font-medium">
                        {restaurant.address || 'Dhaka'}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-rose-600">
                        <span>{formatBDT(deliveryFee)} Fee</span>
                        <span className="text-slate-400">View Menu →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}

        <div ref={loadMoreRef} className="h-10 flex items-center justify-center py-2">
          {(activeTab === 'FOODS' ? isFetchingNextFoods : isFetchingNextKitchens) && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
