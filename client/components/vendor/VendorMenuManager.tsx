// restaurant menu management dashboard with item creator, stock toggles, and deletion
'use client';

import React, { useState } from 'react';
import {
  useRestaurantDetailsQuery,
} from '@/hooks/queries/use-restaurant-queries';
import {
  useCategoriesQuery,
  useUpdateFoodItemMutation,
  useDeleteFoodItemMutation,
} from '@/hooks/queries/use-menu-queries';
import { FoodItemModal } from './FoodItemModal';
import type { Restaurant, FoodItem, MenuCategory } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  UtensilsCrossed,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface VendorMenuManagerProps {
  restaurant: Restaurant;
}

export function VendorMenuManager({ restaurant }: VendorMenuManagerProps) {
  const restaurantId = restaurant.id || restaurant._id;
  const restaurantSlug = restaurant.slug || restaurantId;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const {
    data: restaurantDetails,
    isLoading: isMenuLoading,
  } = useRestaurantDetailsQuery(restaurantSlug);
  const { data: globalCategories = [] } = useCategoriesQuery();

  const updateItemMutation = useUpdateFoodItemMutation(restaurantId);
  const deleteItemMutation = useDeleteFoodItemMutation(restaurantId);

  const menuCategories: MenuCategory[] = restaurantDetails?.menu || [];

  // gather all items across categories
  const allItems: FoodItem[] = [];
  menuCategories.forEach((cat) => {
    if (Array.isArray(cat.items)) {
      cat.items.forEach((item) => {
        allItems.push({
          ...item,
          category_id: typeof item.category_id === 'object' ? item.category_id : cat,
        });
      });
    }
  });

  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    const itemCatId =
      typeof item.category_id === 'object'
        ? (item.category_id as any)?._id || (item.category_id as any)?.id
        : item.category_id;

    const matchesCategory =
      selectedCategoryId === 'ALL' || String(itemCatId) === String(selectedCategoryId);

    return matchesSearch && matchesCategory;
  });

  const handleToggleAvailability = (item: FoodItem) => {
    setActionError('');
    const itemId = item.id || item._id;
    updateItemMutation.mutate(
      {
        foodItemId: itemId,
        updates: { is_available: !item.is_available },
      },
      {
        onError: (err: any) => {
          setActionError(err.message || 'failed to update item stock availability');
        },
      }
    );
  };

  const handleDeleteItem = (itemId: string) => {
    setActionError('');
    deleteItemMutation.mutate(itemId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
      },
      onError: (err: any) => {
        setActionError(err.message || 'failed to delete food item');
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">Menu Builder</h2>
            <p className="text-[11px] text-slate-400 font-medium">Manage catalog, pricing, and stock availability</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null);
            setIsItemModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Food Item</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or description..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedCategoryId === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Items ({allItems.length})
          </button>

          {globalCategories.map((cat) => {
            const catId = cat.id || cat._id;
            const count = allItems.filter((i) => {
              const itemCatId =
                typeof i.category_id === 'object'
                  ? (i.category_id as any)?._id || (i.category_id as any)?.id
                  : i.category_id;
              return String(itemCatId) === String(catId);
            }).length;

            return (
              <button
                key={catId}
                type="button"
                onClick={() => setSelectedCategoryId(catId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedCategoryId === catId
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {isMenuLoading ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-2.5">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
          <p className="text-xs text-slate-400 font-semibold">Loading menu items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900">No Food Items Found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {searchQuery || selectedCategoryId !== 'ALL'
                ? 'Try adjusting your search query or category filter.'
                : 'Click "Add Food Item" above to add your first menu item.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredItems.map((item) => {
            const itemId = item.id || item._id;
            const isDeleting = deleteConfirmId === itemId;
            const variantsCount = item.variants?.length || 0;
            const addOnsCount = item.add_ons?.length || 0;

            return (
              <div
                key={itemId}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                            {item.name}
                          </h4>
                          {item.is_vegetarian && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                              Veg
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-black text-rose-600">
                          {formatBDT(item.base_price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer shrink-0 ${
                          item.is_available
                            ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                        title="toggle in-stock / out-of-stock"
                      >
                        {item.is_available ? 'In Stock' : 'Sold Out'}
                      </button>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    )}

                    {(variantsCount > 0 || addOnsCount > 0) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {variantsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {variantsCount} variant {variantsCount === 1 ? 'group' : 'groups'}
                          </span>
                        )}
                        {addOnsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {addOnsCount} {addOnsCount === 1 ? 'add-on' : 'add-ons'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItem(item);
                        setIsItemModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {isDeleting ? (
                      <div className="flex items-center gap-1 animate-in fade-in">
                        <button
                          type="button"
                          disabled={deleteItemMutation.isPending}
                          onClick={() => handleDeleteItem(itemId)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(itemId)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="delete food item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FoodItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        restaurantId={restaurantId}
        categories={globalCategories}
        initialItem={editingItem}
      />
    </div>
  );
}
