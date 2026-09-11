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
    <div className="space-y-4 sm:space-y-5">
      <div className="relative rounded-3xl bg-gradient-to-br from-rose-50/90 via-orange-50/60 to-amber-50/70 p-4 sm:p-6 space-y-4 border border-rose-100/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
              FoodMan Express
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Delicious Feast, Fast
            </h1>
          </div>

          <div className="w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-xs flex items-center justify-center text-rose-500 border border-rose-100/80 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'FOODS'
                ? 'Search dishes, biryani, burgers, pizza...'
                : 'Search favorite restaurants and kitchens...'
            }
            className="w-full pl-11 pr-11 h-12 rounded-2xl bg-white text-base font-medium text-slate-800 placeholder:text-slate-400 border border-rose-100/90 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-slate-700 active:scale-95 transition cursor-pointer"
              aria-label="Clear search"
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                ✕
              </div>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2.5 overflow-x-auto no-scrollbar py-1 snap-x snap-mandatory scroll-smooth pr-6">
          <button
            onClick={() => {
              setSelectedCategoryId('');
              setActiveTab('FOODS');
            }}
            className={`flex flex-col items-center justify-start gap-1.5 p-2.5 rounded-2xl w-[76px] min-w-[76px] sm:w-[82px] sm:min-w-[82px] transition-all cursor-pointer border shrink-0 snap-start active:scale-95 ${
              !selectedCategoryId && activeTab === 'FOODS'
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25'
                : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-xl shadow-inner shrink-0">
              🍽️
            </div>
            <span className="text-[11px] font-bold tracking-tight text-center leading-tight line-clamp-2 break-words w-full h-7 flex items-center justify-center">
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
                className={`flex flex-col items-center justify-start gap-1.5 p-2.5 rounded-2xl w-[76px] min-w-[76px] sm:w-[82px] sm:min-w-[82px] transition-all cursor-pointer border shrink-0 snap-start active:scale-95 ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-xl shadow-inner shrink-0">
                  {cat.emoji || getCategoryIcon(cat.name)}
                </div>
                <span className="text-[11px] font-bold tracking-tight text-center leading-tight line-clamp-2 break-words w-full h-7 flex items-center justify-center">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-slate-200/80">
        <div className="flex items-center text-xs sm:text-sm font-bold text-slate-500">
          <button
            onClick={() => setActiveTab('FOODS')}
            className={`min-h-[44px] flex items-center px-4 relative transition cursor-pointer active:scale-95 ${
              activeTab === 'FOODS'
                ? 'text-rose-600 font-extrabold after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-rose-600 after:rounded-full'
                : 'hover:text-slate-900'
            }`}
          >
            Foods
          </button>
          <button
            onClick={() => setActiveTab('KITCHENS')}
            className={`min-h-[44px] flex items-center px-4 relative transition cursor-pointer active:scale-95 ${
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
            className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-1.5 mb-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
              showFilterMenu || activeFilterCount > 0
                ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Sort & Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-black">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}
      </div>

      {activeTab === 'FOODS' && showFilterMenu && (
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <ArrowUpDown className="w-4 h-4 text-rose-500" />
              <span>Sort by:</span>
            </span>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 min-h-[36px] flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-xl hover:bg-rose-100 active:scale-95 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset all</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex-1 sm:flex-none justify-center min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                sortBy === 'newest'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <span>⚡ Popular / Newest</span>
            </button>

            <button
              onClick={() => setSortBy('price_asc')}
              className={`flex-1 sm:flex-none justify-center min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                sortBy === 'price_asc'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Price: Low to High</span>
            </button>

            <button
              onClick={() => setSortBy('price_desc')}
              className={`flex-1 sm:flex-none justify-center min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                sortBy === 'price_desc'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Price: High to Low</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100">
            <button
              onClick={() => setIsVegOnly(!isVegOnly)}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                isVegOnly
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Veg Only</span>
            </button>

            <button
              onClick={() => setPriceFilter(priceFilter === 'under_200' ? 'all' : 'under_200')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                priceFilter === 'under_200'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Under ৳200
            </button>

            <button
              onClick={() => setPriceFilter(priceFilter === '200_500' ? 'all' : '200_500')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                priceFilter === '200_500'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              ৳200 - ৳500
            </button>

            <button
              onClick={() => setPriceFilter(priceFilter === 'above_500' ? 'all' : 'above_500')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                priceFilter === 'above_500'
                  ? 'bg-slate-900 text-white shadow-xs'
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-3 space-y-2.5 border border-slate-200/60 animate-pulse">
                  <div className="h-32 sm:h-36 bg-slate-200/80 rounded-2xl" />
                  <div className="h-4 bg-slate-200 rounded-lg w-4/5" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  <div className="pt-2 flex justify-between items-center">
                    <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                    <div className="h-6 bg-slate-100 rounded-lg w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : allFoods.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">No food items found</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {activeFilterCount > 0
                    ? 'No dishes match your active search and filter criteria.'
                    : selectedCategoryId
                    ? 'No available dishes in this category.'
                    : 'Try searching with different keywords.'}
                </p>
              </div>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="min-h-[44px] px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 active:scale-95 transition cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-rose-500/20"
                >
                  <X className="w-4 h-4" />
                  <span>Reset all filters</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
                    className={`group bg-white rounded-3xl border p-2.5 sm:p-3 flex flex-col justify-between space-y-2.5 shadow-xs transition-all duration-150 active:scale-[0.98] ${
                      isAvailable
                        ? 'border-slate-200/80 hover:border-rose-200 hover:shadow-md'
                        : 'border-slate-200/50 bg-slate-50/40 opacity-90'
                    }`}
                  >
                    <div className={`relative h-32 sm:h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center border border-rose-100/60 ${!isAvailable ? 'grayscale-40' : ''}`}>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center text-rose-600 gap-1.5 p-2 overflow-hidden">
                          <div className="w-11 h-11 rounded-2xl bg-white shadow-md shadow-rose-500/15 flex items-center justify-center ring-2 ring-rose-100 group-hover:scale-105 transition">
                            <UtensilsCrossed className="w-5 h-5 text-rose-600" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-rose-600/80">
                            Fresh Dish
                          </span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white border border-white/15 shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{restRating > 0 ? restRating.toFixed(1) : '5.0'}</span>
                        </span>
                      </div>

                      {!isAvailable && (
                        <div className="absolute top-2 right-2 z-10">
                          <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-rose-300 border border-rose-500/40 shadow-xs">
                            Sold Out
                          </span>
                        </div>
                      )}

                      {item.is_vegetarian && (
                        <div className="absolute bottom-2 left-2 z-10 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-xs">
                          Veg
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 px-0.5 flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="font-black text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-rose-600 transition min-h-[32px] sm:min-h-[36px]">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 line-clamp-1 font-medium mt-0.5 flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{restName}</span>
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-100">
                        <div className="flex items-baseline gap-1 min-w-0 flex-wrap">
                          {hasValidDiscount(item.base_price, item.discount_price) ? (
                            <>
                              <span className="text-sm sm:text-base font-black text-rose-600 font-mono tracking-tight">
                                {formatBDT(item.discount_price)}
                              </span>
                              <span className="text-xs font-semibold text-slate-400 line-through font-mono">
                                {formatBDT(item.base_price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm sm:text-base font-black text-rose-600 font-mono tracking-tight">
                              {formatBDT(item.base_price)}
                            </span>
                          )}
                        </div>
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold group-hover:bg-rose-600 group-hover:text-white transition shrink-0 shadow-xs">
                            Order <ChevronRight className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold text-slate-400 group-hover:text-slate-600 transition shrink-0">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-3 space-y-2.5 border border-slate-200/60 animate-pulse">
                  <div className="h-32 sm:h-36 bg-slate-200/80 rounded-2xl" />
                  <div className="h-4 bg-slate-200 rounded-lg w-4/5" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  <div className="pt-2 flex justify-between items-center">
                    <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                    <div className="h-6 bg-slate-100 rounded-lg w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : allKitchens.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">No kitchens available</h3>
              <p className="text-xs text-slate-500">Try resetting your search query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {allKitchens.map((restaurant) => {
                const restId = restaurant.id || restaurant._id;
                return (
                  <Link
                    key={restId}
                    href={`/restaurants/${restaurant.slug || restId}`}
                    className="group bg-white rounded-3xl border border-slate-200/80 p-2.5 sm:p-3 flex flex-col space-y-2.5 shadow-xs hover:border-rose-200 hover:shadow-md transition-all duration-150 active:scale-[0.98]"
                  >
                    <div className="relative h-32 sm:h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 flex items-center justify-center border border-rose-100/60">
                      {restaurant.cover_image_url ? (
                        <img
                          src={restaurant.cover_image_url}
                          alt={restaurant.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center text-rose-600 gap-1.5 p-2 overflow-hidden">
                          <div className="w-11 h-11 rounded-2xl bg-white shadow-md shadow-rose-500/15 flex items-center justify-center ring-2 ring-rose-100 group-hover:scale-105 transition">
                            <Store className="w-5 h-5 text-rose-600" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-rose-600/80">
                            Authentic Kitchen
                          </span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white border border-white/15 shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{restaurant.rating_avg > 0 ? restaurant.rating_avg.toFixed(1) : '5.0'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 px-0.5 min-w-0">
                      <h3 className="font-black text-slate-900 text-xs sm:text-sm truncate group-hover:text-rose-600 transition">
                        {restaurant.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 line-clamp-1 font-medium">
                        {restaurant.address || 'Dhaka'}
                      </p>
                      <div className="pt-2 flex items-center justify-between text-xs font-bold text-rose-600 border-t border-slate-100">
                        <span className="font-mono">{formatBDT(deliveryFee)} Fee</span>
                        <span className="text-slate-400 group-hover:text-rose-600 transition flex items-center gap-0.5">
                          View Menu <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}

        <div ref={loadMoreRef} className="min-h-[44px] flex items-center justify-center py-3">
          {(activeTab === 'FOODS' ? isFetchingNextFoods : isFetchingNextKitchens) && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              <span>Loading more delicious options...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
