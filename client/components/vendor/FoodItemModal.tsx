// modal dialog for creating and editing restaurant menu food items
'use client';

import React, { useState, useEffect } from 'react';
import {
  useCreateFoodItemMutation,
  useUpdateFoodItemMutation,
} from '@/hooks/queries/use-menu-queries';
import type { FoodItem, MenuCategory, VariantGroup, AddOn } from '@/types';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  UtensilsCrossed,
  Sparkles,
  Layers,
  ChevronDown,
  Check,
  Tag,
  Leaf,
} from 'lucide-react';

interface FoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  categories: MenuCategory[];
  initialItem?: FoodItem | null;
}

export function FoodItemModal({
  isOpen,
  onClose,
  restaurantId,
  categories,
  initialItem,
}: FoodItemModalProps) {
  const isEditing = Boolean(initialItem);
  const initialCategoryId =
    typeof initialItem?.category_id === 'object'
      ? (initialItem.category_id as any)?._id || (initialItem.category_id as any)?.id
      : (initialItem?.category_id as string) || (categories[0]?.id || categories[0]?._id || '');

  const [name, setName] = useState(initialItem?.name || '');
  const [categoryId, setCategoryId] = useState(initialCategoryId || '');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [basePrice, setBasePrice] = useState<string>(
    initialItem?.base_price !== undefined ? String(initialItem.base_price) : ''
  );
  const [isVegetarian, setIsVegetarian] = useState(initialItem?.is_vegetarian || false);
  const [isAvailable, setIsAvailable] = useState(
    initialItem?.is_available !== undefined ? initialItem.is_available : true
  );

  const [variants, setVariants] = useState<VariantGroup[]>(
    initialItem?.variants || []
  );
  const [addOns, setAddOns] = useState<AddOn[]>(
    initialItem?.add_ons || []
  );

  const [error, setError] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  const createMutation = useCreateFoodItemMutation(restaurantId);
  const updateMutation = useUpdateFoodItemMutation(restaurantId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryOpen]);

  useEffect(() => {
    if (initialItem) {
      const catId =
        typeof initialItem.category_id === 'object'
          ? (initialItem.category_id as any)?._id || (initialItem.category_id as any)?.id
          : (initialItem.category_id as string);
      setName(initialItem.name || '');
      setCategoryId(catId || '');
      setDescription(initialItem.description || '');
      setBasePrice(String(initialItem.base_price || ''));
      setIsVegetarian(initialItem.is_vegetarian || false);
      setIsAvailable(initialItem.is_available ?? true);
      setVariants(initialItem.variants || []);
      setAddOns(initialItem.add_ons || []);
    } else {
      setName('');
      setCategoryId(categories[0]?.id || categories[0]?._id || '');
      setDescription('');
      setBasePrice('');
      setIsVegetarian(false);
      setIsAvailable(true);
      setVariants([]);
      setAddOns([]);
    }
    setError('');
  }, [initialItem, categories, isOpen]);

  if (!isOpen) return null;

  const handleAddVariantGroup = () => {
    setVariants([
      ...variants,
      {
        title: '',
        options: [{ name: '', price_delta: 0 }],
      },
    ]);
  };

  const handleRemoveVariantGroup = (groupIndex: number) => {
    setVariants(variants.filter((_, idx) => idx !== groupIndex));
  };

  const handleUpdateGroupTitle = (groupIndex: number, title: string) => {
    const updated = [...variants];
    updated[groupIndex].title = title;
    setVariants(updated);
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    const updated = [...variants];
    updated[groupIndex].options.push({
      name: '',
      price_delta: 0,
    });
    setVariants(updated);
  };

  const handleRemoveOptionFromGroup = (groupIndex: number, optionIndex: number) => {
    const updated = [...variants];
    updated[groupIndex].options = updated[groupIndex].options.filter(
      (_, idx) => idx !== optionIndex
    );
    setVariants(updated);
  };

  const handleUpdateOption = (
    groupIndex: number,
    optionIndex: number,
    field: 'name' | 'price_delta',
    value: string | number
  ) => {
    const updated = [...variants];
    if (field === 'price_delta') {
      updated[groupIndex].options[optionIndex].price_delta = Number(value) || 0;
    } else {
      updated[groupIndex].options[optionIndex].name = String(value);
    }
    setVariants(updated);
  };

  const handleAddAddOn = () => {
    setAddOns([...addOns, { name: '', price: 0 }]);
  };

  const handleRemoveAddOn = (index: number) => {
    setAddOns(addOns.filter((_, idx) => idx !== index));
  };

  const handleUpdateAddOn = (
    index: number,
    field: 'name' | 'price',
    value: string | number
  ) => {
    const updated = [...addOns];
    if (field === 'price') {
      updated[index].price = Number(value) || 0;
    } else {
      updated[index].name = String(value);
    }
    setAddOns(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('item name is required');
      return;
    }
    if (!categoryId) {
      setError('please select a category');
      return;
    }
    const priceNum = Number(basePrice);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setError('please enter a valid base price greater than 0');
      return;
    }

    // clean empty variant groups or options
    const cleanedVariants = variants
      .filter((g) => g.title.trim() && g.options.length > 0)
      .map((g) => ({
        title: g.title.trim(),
        options: g.options
          .filter((o) => o.name.trim())
          .map((o) => ({
            name: o.name.trim(),
            price_delta: Number(o.price_delta) || 0,
          })),
      }));

    // clean add-ons
    const cleanedAddOns = addOns
      .filter((a) => a.name.trim())
      .map((a) => ({
        name: a.name.trim(),
        price: Number(a.price) || 0,
      }));

    setError('');

    // TODO: add image upload integration (defaulting image_url to null)
    const payload: any = {
      name: name.trim(),
      category_id: categoryId,
      description: description.trim(),
      base_price: priceNum,
      is_vegetarian: isVegetarian,
      is_available: isAvailable,
      image_url: null,
      variants: cleanedVariants,
      add_ons: cleanedAddOns,
    };

    if (isEditing && initialItem) {
      const itemId = initialItem.id || initialItem._id;
      updateMutation.mutate(
        { foodItemId: itemId, updates: payload },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err: any) => {
            setError(err.message || 'failed to update food item');
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'failed to create food item');
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-3 sm:hidden shrink-0" />

        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 leading-tight truncate">
                {isEditing ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <p className="text-xs text-slate-400 truncate">Configure item details, variants, and pricing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto overflow-x-hidden pr-1 py-3 sm:py-4 space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Smoky BBQ Burger"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1 relative" ref={categoryDropdownRef}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Category *
              </label>

              <button
                type="button"
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                className={`w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border text-left text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                  isCategoryOpen
                    ? 'border-rose-500 ring-2 ring-rose-500/20 bg-white shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Tag className="w-3 h-3" />
                  </div>
                  <span className="truncate text-slate-900 font-extrabold">
                    {categories.find((c) => (c.id || c._id) === categoryId)?.name || 'Select a Category'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isCategoryOpen ? 'rotate-180 text-rose-600' : ''
                  }`}
                />
              </button>

              {isCategoryOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  {categories.map((cat) => {
                    const catId = cat.id || cat._id;
                    const isSelected = catId === categoryId;

                    return (
                      <button
                        key={catId}
                        type="button"
                        onClick={() => {
                          setCategoryId(catId);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-rose-50 text-rose-700 font-black'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-rose-600' : 'bg-slate-300'
                            }`}
                          />
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Base Price (BDT) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400">
                  ৳
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="250"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Item Attributes
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsVegetarian(!isVegetarian)}
                  className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isVegetarian
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Leaf className={`w-3.5 h-3.5 ${isVegetarian ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{isVegetarian ? 'Vegetarian' : 'Non-Veg'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`px-3 py-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isAvailable
                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-extrabold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-rose-600' : 'bg-slate-400'}`} />
                  <span>{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe delicious ingredients, portion size, flavor profile..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <Layers className="w-3.5 h-3.5 text-rose-600" />
                <span>Variant Groups (e.g. Size, Crust)</span>
              </div>
              <button
                type="button"
                onClick={handleAddVariantGroup}
                className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Add Group</span>
              </button>
            </div>

            {variants.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No variant groups defined.</p>
            ) : (
              <div className="space-y-3">
                {variants.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <input
                        type="text"
                        value={group.title}
                        onChange={(e) => handleUpdateGroupTitle(gIdx, e.target.value)}
                        placeholder="Group Title (e.g. Size, Flavor)"
                        className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantGroup(gIdx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        title="Remove group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                      {group.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 min-w-0">
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) =>
                              handleUpdateOption(gIdx, oIdx, 'name', e.target.value)
                            }
                            placeholder="Option (e.g. Large)"
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                          />
                          <div className="flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-xl px-2 py-1">
                            <span className="text-[10px] text-slate-400 font-bold">+৳</span>
                            <input
                              type="number"
                              value={opt.price_delta}
                              onChange={(e) =>
                                handleUpdateOption(gIdx, oIdx, 'price_delta', e.target.value)
                              }
                              placeholder="0"
                              className="w-12 bg-transparent text-slate-800 text-xs font-bold focus:outline-hidden text-right"
                            />
                          </div>
                          {group.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromGroup(gIdx, oIdx)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                              title="Remove option"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddOptionToGroup(gIdx)}
                        className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-0.5 pt-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Add-Ons & Extras (e.g. Cheese, Dip)</span>
              </div>
              <button
                type="button"
                onClick={handleAddAddOn}
                className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Add Extra</span>
              </button>
            </div>

            {addOns.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No add-ons defined.</p>
            ) : (
              <div className="space-y-2">
                {addOns.map((addOn, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      value={addOn.name}
                      onChange={(e) => handleUpdateAddOn(aIdx, 'name', e.target.value)}
                      placeholder="Add-on name (e.g. Extra Mayo)"
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    />
                    <div className="flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
                      <span className="text-[11px] text-slate-400 font-bold">৳</span>
                      <input
                        type="number"
                        value={addOn.price}
                        onChange={(e) => handleUpdateAddOn(aIdx, 'price', e.target.value)}
                        placeholder="Price"
                        className="w-14 bg-transparent text-slate-800 text-xs font-bold focus:outline-hidden text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAddOn(aIdx)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                      title="Remove add-on"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isEditing ? (
              'Update Item'
            ) : (
              'Save Item'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
