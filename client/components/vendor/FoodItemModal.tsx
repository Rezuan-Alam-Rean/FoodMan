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
    initialItem?.base_price !== undefined && initialItem?.base_price !== null
      ? String(initialItem.base_price)
      : ''
  );
  const [discountPrice, setDiscountPrice] = useState<string>(
    initialItem?.discount_price !== undefined && initialItem?.discount_price !== null
      ? String(initialItem.discount_price)
      : ''
  );
  const [isVegetarian, setIsVegetarian] = useState(initialItem?.is_vegetarian || false);
  const [isAvailable, setIsAvailable] = useState(
    initialItem?.is_available !== undefined ? initialItem.is_available : true
  );

  const [variants, setVariants] = useState<VariantGroup[]>(() =>
    (initialItem?.variants || []).map((g) => ({
      title: g.title,
      options: (g.options || []).map((o) => ({
        name: o.name,
        price: Number(o.price) || 0,
        discount_price:
          o.discount_price !== undefined && o.discount_price !== null
            ? Number(o.discount_price)
            : null,
      })),
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
      setBasePrice(
        initialItem.base_price !== null && initialItem.base_price !== undefined
          ? String(initialItem.base_price)
          : ''
      );
      setDiscountPrice(
        initialItem.discount_price !== undefined && initialItem.discount_price !== null
          ? String(initialItem.discount_price)
          : ''
      );
      setIsVegetarian(initialItem.is_vegetarian || false);
      setIsAvailable(initialItem.is_available ?? true);
      setVariants(
        (initialItem.variants || []).map((g) => ({
          title: g.title,
          options: (g.options || []).map((o) => ({
            name: o.name,
            price: Number(o.price) || 0,
            discount_price:
              o.discount_price !== undefined && o.discount_price !== null
                ? Number(o.discount_price)
                : null,
          })),
        }))
      );
      setAddOns((initialItem.add_ons || []).map((a) => ({ ...a })));
      setImageUrl(initialItem.image_url || '');
    } else {
      setName('');
      setCategoryId(categories[0]?.id || categories[0]?._id || '');
      setDescription('');
      setBasePrice('');
      setDiscountPrice('');
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
        options: [{ name: '', price: 0 }],
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
          ? { ...g, options: [...g.options, { name: '', price: 0 }] }
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
    field: 'name' | 'price' | 'discount_price',
    value: string | number
  ) => {
    setVariants((prev) =>
      prev.map((g, idx) => {
        if (idx !== groupIndex) return g;
        const newOptions = g.options.map((opt, oIdx) => {
          if (oIdx !== optionIndex) return opt;
          if (field === 'price') {
            if (value === '') {
              return { ...opt, price: '' as any };
            }
            const numVal = Number(value);
            return {
              ...opt,
              price: isNaN(numVal) ? ('' as any) : numVal,
            };
          }
          if (field === 'discount_price') {
            if (value === '' || value === null || value === undefined) {
              return { ...opt, discount_price: null };
            }
            const numVal = Number(value);
            return {
              ...opt,
              discount_price: isNaN(numVal) ? ('' as any) : numVal,
            };
          }
          return {
            ...opt,
            [field]: String(value),
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

    let parsedDiscountPrice: number | null = null;
    if (discountPrice.trim()) {
      const dNum = Number(discountPrice);
      if (isNaN(dNum) || dNum < 0) {
        setError('Discount price must be a non-negative number');
        return;
      }
      if (dNum >= priceNum) {
        setError(`Discount price (৳${dNum}) must be strictly less than base price (৳${priceNum})`);
        return;
      }
      parsedDiscountPrice = dNum;
    }

    // validate variant prices and discount prices
    for (const g of variants) {
      if (g.title.trim()) {
        for (const o of g.options) {
          if (o.name.trim()) {
            const optPrice = Number(o.price);
            if (isNaN(optPrice) || optPrice < 0 || (o.price as any) === '' || (o.price as any) === undefined) {
              setError(`Price is required for variant "${o.name.trim()}" in group "${g.title.trim()}"`);
              return;
            }
            if (
              o.discount_price !== null &&
              o.discount_price !== undefined &&
              (o.discount_price as any) !== ''
            ) {
              const optDisc = Number(o.discount_price);
              if (isNaN(optDisc) || optDisc < 0) {
                setError(`Discount price for variant "${o.name.trim()}" must be non-negative`);
                return;
              }
              if (optDisc >= optPrice) {
                setError(`Discount price (৳${optDisc}) for variant "${o.name.trim()}" must be strictly less than regular price (৳${optPrice})`);
                return;
              }
            }
          }
        }
      }
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
            price: Number(o.price) || 0,
            discount_price:
              o.discount_price !== null &&
              o.discount_price !== undefined &&
              (o.discount_price as any) !== '' &&
              !isNaN(Number(o.discount_price))
                ? Number(o.discount_price)
                : null,
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

    const trimmedImageUrl = imageUrl.trim();
    if (trimmedImageUrl) {
      try {
        const parsed = new URL(trimmedImageUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error();
        }
      } catch {
        setError('Please enter a valid HTTP or HTTPS dish photo URL');
        return;
      }
    }

    setError('');

    const payload: any = {
      name: name.trim(),
      category_id: categoryId,
      description: description.trim(),
      base_price: priceNum,
      discount_price: parsedDiscountPrice,
      is_vegetarian: isVegetarian,
      is_available: isAvailable,
      image_url: trimmedImageUrl || null,
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
      <div className="w-full sm:max-w-xl bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
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
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition flex items-center justify-center cursor-pointer shrink-0 active:scale-[0.98] transition-transform"
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
                className="min-h-[44px] px-2 inline-flex items-center text-xs font-bold text-rose-600 hover:text-rose-700 transition cursor-pointer active:scale-[0.98] transition-transform"
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
                className="w-full h-11 sm:h-10 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 placeholder:font-sans placeholder:text-slate-400"
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
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-[0.98] transition-transform"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-600" />
                    <span>Change Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shadow-sm flex items-center justify-center active:scale-[0.98] transition-transform"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Smoky BBQ Burger"
                className="w-full h-11 sm:h-10 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5 relative" ref={categoryDropdownRef}>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Category *
              </label>

              <button
                type="button"
                onClick={() => setIsCategoryOpen((prev) => !prev)}
                className={`w-full h-11 sm:h-10 px-3.5 rounded-2xl bg-slate-50 border text-left text-base sm:text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
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
                        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98] transition-transform ${
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Base Price (BDT) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="250"
                  className="w-full h-11 sm:h-10 pl-8 pr-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Discount Price (BDT)
                </label>
                <span className="text-[10px] font-semibold text-slate-400">Optional</span>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="e.g. 199"
                  className="w-full h-11 sm:h-10 pl-8 pr-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Dietary & Availability
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsVegetarian(!isVegetarian)}
                className={`h-11 sm:h-10 px-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform ${
                  isVegetarian
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70'
                }`}
              >
                <Leaf className={`w-4 h-4 ${isVegetarian ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{isVegetarian ? 'Vegetarian' : 'Non-Veg'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`h-11 sm:h-10 px-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform ${
                  isAvailable
                    ? 'bg-rose-50 border-rose-300 text-rose-800 font-extrabold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100/70'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-rose-600 ring-2 ring-rose-300' : 'bg-slate-400'}`} />
                <span>{isAvailable ? 'In Stock' : 'Out of Stock'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe delicious ingredients, portion size, flavor profile..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 min-h-[72px]"
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
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-[0.98] transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
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
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <input
                        type="text"
                        value={group.title}
                        onChange={(e) => handleUpdateGroupTitle(gIdx, e.target.value)}
                        placeholder="Group Title (e.g. Size, Flavor)"
                        className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-900 text-base sm:text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantGroup(gIdx)}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer shrink-0 active:scale-[0.98] transition-transform"
                        title="Remove group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 pl-2 border-l-2 border-slate-200">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase px-1">
                        <span className="flex-1">Option Name</span>
                        <span className="w-20 sm:w-24 text-right pr-2.5 shrink-0">Price</span>
                        <span className="w-20 sm:w-24 text-right pr-2.5 shrink-0">Discount</span>
                        <span className="w-8 shrink-0" />
                      </div>

                      {group.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 min-w-0">
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) =>
                              handleUpdateOption(gIdx, oIdx, 'name', e.target.value)
                            }
                            placeholder="Option (e.g. Large)"
                            className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-base sm:text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                          />
                          <div className="w-20 sm:w-24 flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-xl px-2.5 h-10 focus-within:ring-1 focus-within:ring-rose-500 focus-within:border-rose-500 transition" title="Regular Price">
                            <span className="text-xs text-slate-400 font-bold pointer-events-none">৳</span>
                            <input
                              type="number"
                              min="0"
                              required
                              value={opt.price}
                              onChange={(e) =>
                                handleUpdateOption(gIdx, oIdx, 'price', e.target.value)
                              }
                              placeholder="0"
                              className="w-full bg-transparent text-slate-800 text-base sm:text-xs font-bold focus:outline-hidden text-right"
                            />
                          </div>
                          <div className="w-20 sm:w-24 flex items-center gap-1 shrink-0 bg-white border border-slate-200 rounded-xl px-2.5 h-10 focus-within:ring-1 focus-within:ring-rose-500 focus-within:border-rose-500 transition" title="Discount Price (Optional)">
                            <span className="text-xs text-slate-400 font-bold pointer-events-none">৳</span>
                            <input
                              type="number"
                              min="0"
                              value={opt.discount_price !== null && opt.discount_price !== undefined ? opt.discount_price : ''}
                              onChange={(e) =>
                                handleUpdateOption(gIdx, oIdx, 'discount_price', e.target.value)
                              }
                              placeholder="Optional"
                              className="w-full bg-transparent text-slate-800 text-base sm:text-xs font-bold focus:outline-hidden text-right placeholder:font-normal placeholder:text-slate-300"
                            />
                          </div>
                          {group.options.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromGroup(gIdx, oIdx)}
                              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0 active:scale-[0.98] transition-transform"
                              title="Remove option"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="w-8 shrink-0" />
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddOptionToGroup(gIdx)}
                        className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 pt-1.5 cursor-pointer active:scale-[0.98] transition-transform"
                      >
                        <Plus className="w-3.5 h-3.5" />
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
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-[0.98] transition-transform"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra</span>
              </button>
            </div>

            {addOns.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No add-ons defined.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase px-1">
                  <span className="flex-1">Add-On Item Name</span>
                  <span className="w-20 sm:w-24 text-right pr-2.5 shrink-0">Price</span>
                  <span className="w-10 shrink-0" />
                </div>

                {addOns.map((addOn, aIdx) => (
                  <div key={aIdx} className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      value={addOn.name}
                      onChange={(e) => handleUpdateAddOn(aIdx, 'name', e.target.value)}
                      placeholder="Add-on name (e.g. Extra Mayo)"
                      className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-base sm:text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                    />
                    <div className="w-20 sm:w-24 flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-10 focus-within:ring-1 focus-within:ring-rose-500 focus-within:border-rose-500 transition">
                      <span className="text-xs text-slate-400 font-bold pointer-events-none">৳</span>
                      <input
                        type="number"
                        min="0"
                        value={addOn.price}
                        onChange={(e) => handleUpdateAddOn(aIdx, 'price', e.target.value)}
                        placeholder="0"
                        className="w-full bg-transparent text-slate-800 text-base sm:text-xs font-bold focus:outline-hidden text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAddOn(aIdx)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer shrink-0 active:scale-[0.98] transition-transform"
                      title="Remove add-on"
                    >
                      <Trash2 className="w-4 h-4" />
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
            className="flex-1 min-h-[48px] py-3 rounded-2xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-bold hover:bg-slate-50 active:scale-[0.98] transition-transform transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={createMutation.isPending || updateMutation.isPending || isUploadingImage}
            onClick={handleSubmit}
            className="flex-1 min-h-[48px] py-3 rounded-2xl bg-rose-600 text-white text-xs sm:text-sm font-black hover:bg-rose-700 active:scale-[0.98] transition-transform transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
