// customer discovery feed with foods and kitchens tabs and infinite scroll
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useInfiniteFoodItemsQuery, useCategoriesQuery } from '@/hooks/queries/use-menu-queries';
import { useInfiniteRestaurantsQuery } from '@/hooks/queries/use-restaurant-queries';
import { useZoneStore } from '@/lib/store/zone-store';
import { formatBDT } from '@/lib/utils';
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

export default function CustomerHomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [activeTab, setActiveTab] = useState<'FOODS' | 'KITCHENS'>('FOODS');
  const { selectedZone } = useZoneStore();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  // query categories for horizontal filter
  const { data: categories = [] } = useCategoriesQuery({ is_active: true });

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
    is_available: true,
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
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => {
              setSelectedCategoryId('');
              setActiveTab('FOODS');
            }}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl min-w-[68px] transition cursor-pointer border ${
              !selectedCategoryId && activeTab === 'FOODS'
                ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-inner">
              🍽️
            </div>
            <span className="text-[10px] font-bold tracking-tight">All</span>
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
                className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl min-w-[68px] transition cursor-pointer border ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-white border-slate-200/70 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-inner">
                  {getCategoryIcon(cat.name)}
                </div>
                <span className="text-[10px] font-bold tracking-tight truncate max-w-[64px]">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center border-b border-slate-200/80 text-xs font-bold text-slate-500">
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
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
          {selectedZone && (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              {selectedZone.name} • ৳{selectedZone.fixed_delivery_fee}
            </span>
          )}
        </div>

        {activeTab === 'FOODS' ? (
          isFoodsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-3 space-y-2 border border-slate-100 animate-pulse">
                  <div className="h-28 bg-slate-200 rounded-2xl" />
                  <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : allFoods.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-xs">No food items found</h3>
              <p className="text-[11px] text-slate-400">
                {selectedCategoryId ? 'No available items in this category.' : 'Try changing your search keywords.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {allFoods.map((item) => {
                const restObj = typeof item.restaurant_id === 'object' ? (item.restaurant_id as Restaurant) : null;
                const restSlug = restObj?.slug || restObj?._id || restObj?.id || item.restaurant_id;
                const restName = restObj?.name || 'Kitchen';
                const restRating = restObj?.rating_avg || 4.8;

                return (
                  <Link
                    key={item.id || item._id}
                    href={`/restaurants/${restSlug}`}
                    className="group bg-white rounded-3xl border border-slate-200/70 p-2.5 flex flex-col justify-between space-y-2 shadow-xs hover:shadow-md transition active:scale-[0.98]"
                  >
                    <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center border border-slate-800/40">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center text-white/90 gap-1.5 p-2 overflow-hidden">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 shadow-md shadow-rose-600/30 flex items-center justify-center ring-2 ring-white/10 group-hover:scale-105 transition">
                            <UtensilsCrossed className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-rose-300">
                            Fresh Dish
                          </span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white border border-white/10 shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{restRating > 0 ? restRating.toFixed(1) : '5.0'}</span>
                        </span>
                      </div>

                      {item.is_vegetarian && (
                        <div className="absolute bottom-2 left-2 z-10 bg-emerald-600/90 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">
                          Veg
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 px-1 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-xs truncate group-hover:text-rose-600 transition">
                          {item.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 line-clamp-1 font-medium mt-0.5 flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{restName}</span>
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-xs font-black text-rose-600 font-mono">
                          {formatBDT(item.base_price)}
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold text-slate-500 group-hover:text-rose-600 transition">
                          Order <ChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : (
          isKitchensLoading ? (
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
              {allKitchens.map((restaurant) => {
                const restId = restaurant.id || restaurant._id;
                return (
                  <Link
                    key={restId}
                    href={`/restaurants/${restaurant.slug || restId}`}
                    className="group bg-white rounded-3xl border border-slate-200/70 p-2.5 flex flex-col space-y-2 shadow-xs hover:shadow-md transition active:scale-[0.98]"
                  >
                    <div className="relative h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 flex items-center justify-center border border-slate-800/40">
                      {restaurant.cover_image_url ? (
                        <img
                          src={restaurant.cover_image_url}
                          alt={restaurant.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center text-white/90 gap-1.5 p-2 overflow-hidden">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 shadow-md shadow-rose-600/30 flex items-center justify-center ring-2 ring-white/10 group-hover:scale-105 transition">
                            <Store className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-rose-300">
                            Authentic Kitchen
                          </span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white border border-white/10 shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          <span>{restaurant.rating_avg > 0 ? restaurant.rating_avg.toFixed(1) : '5.0'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 px-1">
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
          {(isFetchingNextFoods || isFetchingNextKitchens) && (
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
