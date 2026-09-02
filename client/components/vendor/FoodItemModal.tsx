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
  UploadCloud,
  Camera,
} from 'lucide-react';
import { useUploadImageMutation } from '@/hooks/queries/use-upload-config-queries';

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

  const [variants, setVariants] = useState<VariantGroup[]>(() =>
    (initialItem?.variants || []).map((g) => ({
      title: g.title,
      options: (g.options || []).map((o) => ({ ...o })),
    }))
  );
  const [addOns, setAddOns] = useState<AddOn[]>(() =>
    (initialItem?.add_ons || []).map((a) => ({ ...a }))
  );

  const [imageUrl, setImageUrl] = useState(initialItem?.image_url || '');
  const [isImageManual, setIsImageManual] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);

  const [error, setError] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);

  const createMutation = useCreateFoodItemMutation(restaurantId);
  const updateMutation = useUpdateFoodItemMutation(restaurantId);
  const uploadImageMutation = useUploadImageMutation();

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
      setVariants(
        (initialItem.variants || []).map((g) => ({
          title: g.title,
          options: (g.options || []).map((o) => ({ ...o })),
        }))
      );
      setAddOns((initialItem.add_ons || []).map((a) => ({ ...a })));
      setImageUrl(initialItem.image_url || '');
    } else {
      setName('');
      setCategoryId(categories[0]?.id || categories[0]?._id || '');
      setDescription('');
      setBasePrice('');
      setIsVegetarian(false);
      setIsAvailable(true);
      setVariants([]);
      setAddOns([]);
      setImageUrl('');
    }
    setError('');
  }, [initialItem, categories, isOpen]);

  if (!isOpen) return null;

  const handleAddVariantGroup = () => {
    setVariants((prev) => [
      ...prev,
      {
        title: '',
        options: [{ name: '', price_delta: 0 }],
      },
    ]);
  };

  const handleRemoveVariantGroup = (groupIndex: number) => {
    setVariants((prev) => prev.filter((_, idx) => idx !== groupIndex));
  };

  const handleUpdateGroupTitle = (groupIndex: number, title: string) => {
    setVariants((prev) =>
      prev.map((g, idx) => (idx === groupIndex ? { ...g, title } : g))
    );
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    setVariants((prev) =>
      prev.map((g, idx) =>
        idx === groupIndex
          ? { ...g, options: [...g.options, { name: '', price_delta: 0 }] }
          : g
      )
    );
  };

  const handleRemoveOptionFromGroup = (groupIndex: number, optionIndex: number) => {
    setVariants((prev) =>
      prev.map((g, idx) =>
        idx === groupIndex
          ? { ...g, options: g.options.filter((_, oIdx) => oIdx !== optionIndex) }
          : g
      )
    );
  };

  const handleUpdateOption = (
    groupIndex: number,
    optionIndex: number,
    field: 'name' | 'price_delta',
    value: string | number
  ) => {
    setVariants((prev) =>
      prev.map((g, idx) => {
        if (idx !== groupIndex) return g;
        const newOptions = g.options.map((opt, oIdx) => {
          if (oIdx !== optionIndex) return opt;
          return {
            ...opt,
            [field]: field === 'price_delta' ? Number(value) || 0 : String(value),
          };
        });
        return { ...g, options: newOptions };
      })
    );
  };

  const handleAddAddOn = () => {
    setAddOns((prev) => [...prev, { name: '', price: 0 }]);
  };

  const handleRemoveAddOn = (index: number) => {
    setAddOns((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateAddOn = (
    index: number,
    field: 'name' | 'price',
    value: string | number
  ) => {
    setAddOns((prev) =>
      prev.map((a, idx) => {
        if (idx !== index) return a;
        return {
          ...a,
          [field]: field === 'price' ? Number(value) || 0 : String(value),
        };
      })
    );
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }

    setError('');
    setIsUploadingImage(true);
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (result?.url) {
        setImageUrl(result.url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload dish photo to Cloudinary');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('item name is required');
      return;
    }

    if (!categoryId) {
      setError('category is required');
      return;
    }

    const priceNum = Number(basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('valid base price is required');
      return;
    }

    // clean variants
    const cleanedVariants = variants
      .filter((g) => g.title.trim())
      .map((g) => ({
        title: g.title.trim(),
        options: g.options
          .filter((o) => o.name.trim())
          .map((o) => ({
            name: o.name.trim(),
            price_delta: Number(o.price_delta) || 0,
          })),
      }))
      .filter((g) => g.options.length > 0);

    // clean add-ons
    const cleanedAddOns = addOns
      .filter((a) => a.name.trim())
      .map((a) => ({
        name: a.name.trim(),
        price: Number(a.price) || 0,
      }));

    setError('');

    const payload: any = {
      name: name.trim(),
      category_id: categoryId,
      description: description.trim(),
      base_price: priceNum,
      is_vegetarian: isVegetarian,
      is_available: isAvailable,
      image_url: imageUrl.trim() ? imageUrl.trim() : null,
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
      <div className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
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

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Dish Photo (Cloudinary)
              </label>
              <button
                type="button"
                onClick={() => setIsImageManual(!isImageManual)}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer"
              >
                {isImageManual ? 'Upload file' : 'Enter URL manually'}
              </button>
            </div>

            {isImageManual ? (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/.../dish.jpg"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 placeholder:font-sans placeholder:text-slate-400"
              />
            ) : imageUrl ? (
              <div className="relative h-32 sm:h-36 w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 group">
                <img
                  src={imageUrl}
                  alt="Dish preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                    <span>Change Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-sm"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/70 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
                    <span>Uploading dish photo to Cloudinary...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-rose-500" />
                    <span className="text-xs font-bold text-slate-700">Upload Dish Photo</span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG, WEBP or GIF (automatically routes to active upload endpoint)
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

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
            disabled={createMutation.isPending || updateMutation.isPending || isUploadingImage}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {createMutation.isPending || updateMutation.isPending || isUploadingImage ? (
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
