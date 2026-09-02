// admin menu categories management desk with interactive food emoji & icon picker
'use client';

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/hooks/queries/use-menu-queries';
import type { MenuCategory } from '@/types';

type ModalMode = 'create' | 'edit';

interface FormState {
  name: string;
  emoji: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  emoji: '🍽️',
  sort_order: 0,
  is_active: true,
};

interface EmojiItem {
  char: string;
  name: string;
  group: string;
  keywords: string[];
}

const FOOD_EMOJIS: EmojiItem[] = [
  // Fast Food & Meals
  { char: '🍔', name: 'Burger', group: 'Fast Food', keywords: ['burger', 'cheeseburger', 'beef', 'patty', 'fast food'] },
  { char: '🍕', name: 'Pizza', group: 'Fast Food', keywords: ['pizza', 'slice', 'italian', 'cheese'] },
  { char: '🍟', name: 'French Fries', group: 'Fast Food', keywords: ['fries', 'potato', 'chips', 'fast food'] },
  { char: '🌭', name: 'Hot Dog', group: 'Fast Food', keywords: ['hotdog', 'sausage', 'fast food'] },
  { char: '🥪', name: 'Sandwich', group: 'Fast Food', keywords: ['sandwich', 'bread', 'sub', 'toast'] },
  { char: '🌮', name: 'Taco', group: 'Fast Food', keywords: ['taco', 'mexican'] },
  { char: '🌯', name: 'Burrito', group: 'Fast Food', keywords: ['burrito', 'wrap', 'roll', 'shawarma'] },
  { char: '🥙', name: 'Stuffed Flatbread', group: 'Fast Food', keywords: ['shawarma', 'kebab', 'pita', 'falafel'] },
  { char: '🧆', name: 'Falafel', group: 'Fast Food', keywords: ['falafel', 'meatball', 'chickpea'] },
  { char: '🍗', name: 'Poultry Leg', group: 'Fast Food', keywords: ['chicken', 'drumstick', 'fried chicken', 'broast'] },
  { char: '🍖', name: 'Meat on Bone', group: 'Fast Food', keywords: ['kacchi', 'biryani', 'mutton', 'beef', 'meat', 'ribs'] },
  { char: '🥩', name: 'Steak', group: 'Fast Food', keywords: ['steak', 'beef', 'meat', 'grill', 'bbq'] },
  { char: '🥓', name: 'Bacon', group: 'Fast Food', keywords: ['bacon', 'pork', 'strips'] },

  // Rice, Curry & Asian
  { char: '🍲', name: 'Pot of Food', group: 'Rice & Asian', keywords: ['biryani', 'curry', 'stew', 'soup', 'kacchi', 'khichuri'] },
  { char: '🍛', name: 'Curry & Rice', group: 'Rice & Asian', keywords: ['curry', 'rice', 'indian', 'bengali', 'masala'] },
  { char: '🍚', name: 'Cooked Rice', group: 'Rice & Asian', keywords: ['rice', 'plain rice', 'steamed rice', 'polao'] },
  { char: '🍙', name: 'Rice Ball', group: 'Rice & Asian', keywords: ['rice', 'onigiri', 'japanese'] },
  { char: '🍜', name: 'Noodles / Ramen', group: 'Rice & Asian', keywords: ['noodles', 'ramen', 'soup', 'chowmein', 'pasta'] },
  { char: '🍝', name: 'Spaghetti', group: 'Rice & Asian', keywords: ['pasta', 'spaghetti', 'italian'] },
  { char: '🍣', name: 'Sushi', group: 'Rice & Asian', keywords: ['sushi', 'japanese', 'fish', 'asian'] },
  { char: '🍱', name: 'Bento Box', group: 'Rice & Asian', keywords: ['bento', 'platter', 'set menu', 'thali', 'combo'] },
  { char: '🥟', name: 'Dumpling / Momo', group: 'Rice & Asian', keywords: ['dumpling', 'momo', 'dimsum', 'wonton'] },
  { char: '🍤', name: 'Fried Shrimp', group: 'Rice & Asian', keywords: ['shrimp', 'prawn', 'tempura', 'seafood'] },
  { char: '🍢', name: 'Kebab / Skewer', group: 'Rice & Asian', keywords: ['kebab', 'skewer', 'tikka', 'bbq', 'sheekh'] },
  { char: '🍘', name: 'Rice Cracker', group: 'Rice & Asian', keywords: ['cracker', 'snack', 'papadum'] },
  { char: '🥮', name: 'Mooncake / Pastry', group: 'Rice & Asian', keywords: ['pastry', 'sweet', 'bakery', 'pitha'] },

  // Breakfast & Bakery
  { char: '🍳', name: 'Cooking / Egg', group: 'Bakery & Cafe', keywords: ['egg', 'breakfast', 'omelet', 'fry'] },
  { char: '🥞', name: 'Pancakes', group: 'Bakery & Cafe', keywords: ['pancake', 'breakfast', 'crepe'] },
  { char: '🧇', name: 'Waffle', group: 'Bakery & Cafe', keywords: ['waffle', 'belgian', 'breakfast'] },
  { char: '🥐', name: 'Croissant', group: 'Bakery & Cafe', keywords: ['croissant', 'bakery', 'pastry'] },
  { char: '🥖', name: 'Baguette', group: 'Bakery & Cafe', keywords: ['baguette', 'bread', 'french'] },
  { char: '🥨', name: 'Pretzel', group: 'Bakery & Cafe', keywords: ['pretzel', 'snack', 'bakery'] },
  { char: '🥯', name: 'Bagel', group: 'Bakery & Cafe', keywords: ['bagel', 'bread', 'breakfast'] },
  { char: '🍞', name: 'Bread Loaf', group: 'Bakery & Cafe', keywords: ['bread', 'toast', 'bakery'] },
  { char: '🧀', name: 'Cheese', group: 'Bakery & Cafe', keywords: ['cheese', 'cheddar', 'dairy'] },
  { char: '🥗', name: 'Green Salad', group: 'Bakery & Cafe', keywords: ['salad', 'healthy', 'diet', 'greens', 'veg'] },

  // Desserts & Sweets
  { char: '🍰', name: 'Shortcake', group: 'Desserts', keywords: ['cake', 'dessert', 'sweet', 'pastry', 'pastry'] },
  { char: '🎂', name: 'Birthday Cake', group: 'Desserts', keywords: ['cake', 'birthday', 'party', 'dessert'] },
  { char: '🧁', name: 'Cupcake', group: 'Desserts', keywords: ['cupcake', 'muffin', 'bakery', 'dessert'] },
  { char: '🥧', name: 'Pie', group: 'Desserts', keywords: ['pie', 'tart', 'dessert'] },
  { char: '🍦', name: 'Soft Ice Cream', group: 'Desserts', keywords: ['ice cream', 'cone', 'dessert', 'vanilla'] },
  { char: '🍧', name: 'Shaved Ice', group: 'Desserts', keywords: ['ice', 'dessert', 'falooda', 'kulfi'] },
  { char: '🍨', name: 'Ice Cream Bowl', group: 'Desserts', keywords: ['ice cream', 'dessert', 'gelato'] },
  { char: '🍩', name: 'Doughnut', group: 'Desserts', keywords: ['donut', 'doughnut', 'glazed', 'bakery'] },
  { char: '🍪', name: 'Cookie', group: 'Desserts', keywords: ['cookie', 'biscuit', 'chocolate chip'] },
  { char: '🍫', name: 'Chocolate Bar', group: 'Desserts', keywords: ['chocolate', 'candy', 'sweet'] },
  { char: '🍮', name: 'Custard / Pudding', group: 'Desserts', keywords: ['pudding', 'custard', 'flan', 'caramel', 'firni'] },
  { char: '🍯', name: 'Honey Pot', group: 'Desserts', keywords: ['honey', 'syrup', 'sweet'] },

  // Drinks & Beverages
  { char: '🥤', name: 'Cup with Straw', group: 'Drinks', keywords: ['drink', 'soda', 'beverage', 'cola', 'borhani', 'lassi'] },
  { char: '🧋', name: 'Bubble Tea', group: 'Drinks', keywords: ['boba', 'bubble tea', 'milk tea', 'tea'] },
  { char: '☕', name: 'Hot Beverage', group: 'Drinks', keywords: ['coffee', 'tea', 'latte', 'espresso', 'cha'] },
  { char: '🍵', name: 'Teacup', group: 'Drinks', keywords: ['green tea', 'tea', 'matcha', 'hot drink'] },
  { char: '🧃', name: 'Beverage Box', group: 'Drinks', keywords: ['juice', 'box', 'fruit juice'] },
  { char: '🥛', name: 'Glass of Milk', group: 'Drinks', keywords: ['milk', 'dairy', 'shake', 'smoothie'] },
  { char: '🧊', name: 'Ice Cube', group: 'Drinks', keywords: ['ice', 'cold', 'refreshing'] },
  { char: '🍹', name: 'Tropical Drink', group: 'Drinks', keywords: ['cocktail', 'mocktail', 'juice', 'smoothie'] },

  // General & Dining
  { char: '🍽️', name: 'Fork and Knife Plate', group: 'General', keywords: ['all', 'food', 'plate', 'dinner', 'restaurant', 'meal'] },
  { char: '🥢', name: 'Chopsticks', group: 'General', keywords: ['chopsticks', 'asian', 'chinese'] },
  { char: '🥡', name: 'Takeout Box', group: 'General', keywords: ['takeout', 'box', 'delivery', 'to go'] },
  { char: '🥘', name: 'Shallow Pan of Food', group: 'General', keywords: ['paella', 'karahi', 'handi', 'curry'] },
  { char: '🔥', name: 'Fire / Spicy', group: 'General', keywords: ['spicy', 'hot', 'naga', 'fire', 'grill'] },
  { char: '⭐', name: 'Special / Star', group: 'General', keywords: ['special', 'featured', 'top', 'star'] },
];

const EMOJI_GROUPS = ['All', 'Fast Food', 'Rice & Asian', 'Bakery & Cafe', 'Desserts', 'Drinks', 'General'];

export function AdminCategoryDesk() {
  const { data: categories = [], isLoading, isError, refetch } = useCategoriesQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Emoji picker states
  const [emojiSearch, setEmojiSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  const createCategoryMutation = useCreateCategoryMutation();
  const updateCategoryMutation = useUpdateCategoryMutation();
  const deleteCategoryMutation = useDeleteCategoryMutation();

  // Close modal on Escape
  React.useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingCategory(null);
    setForm({
      ...EMPTY_FORM,
      sort_order: categories.length + 1,
    });
    setFormError('');
    setEmojiSearch('');
    setSelectedGroup('All');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: MenuCategory) => {
    setModalMode('edit');
    setEditingCategory(category);
    setForm({
      name: category.name || '',
      emoji: category.emoji || '🍽️',
      sort_order: category.sort_order ?? 0,
      is_active: category.is_active ?? true,
    });
    setFormError('');
    setEmojiSearch('');
    setSelectedGroup('All');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.name.trim()) {
      setFormError('Category name is required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      emoji: form.emoji.trim() || '🍽️',
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };

    if (modalMode === 'edit' && editingCategory) {
      updateCategoryMutation.mutate(
        {
          categoryId: editingCategory._id || editingCategory.id,
          updates: payload,
        },
        {
          onSuccess: () => setIsModalOpen(false),
          onError: (err: any) => setFormError(err.message || 'Failed to update category'),
        }
      );
    } else {
      createCategoryMutation.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
        onError: (err: any) => setFormError(err.message || 'Failed to create category'),
      });
    }
  };

  const handleDelete = (categoryId: string) => {
    setDeleteError(null);
    deleteCategoryMutation.mutate(categoryId, {
      onSuccess: () => {
        setDeleteConfirmId(null);
        setDeleteError(null);
      },
      onError: (err: any) => {
        setDeleteError(err.message || 'Failed to delete category');
      },
    });
  };

  const isSubmitting =
    createCategoryMutation.isPending || updateCategoryMutation.isPending;

  // Filtered emojis based on group and search
  const filteredEmojis = FOOD_EMOJIS.filter((item) => {
    const matchesGroup = selectedGroup === 'All' || item.group === selectedGroup;
    if (!matchesGroup) return false;
    if (!emojiSearch.trim()) return true;
    const q = emojiSearch.toLowerCase().trim();
    return (
      item.char.includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const sortedCategories = [...categories].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">Menu Categories</h2>
            <p className="text-[11px] text-slate-400 font-medium">
              catalog categories, icons, and order sequence
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-slate-900/10 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Category</span>
        </button>
      </div>

      {deleteError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeleteError(null)}
            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-rose-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Failed to load categories</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer hover:bg-rose-700 transition"
          >
            Try Again
          </button>
        </div>
      ) : sortedCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto text-2xl">
            🍔
          </div>
          <p className="text-sm font-black text-slate-700">No categories found</p>
          <p className="text-xs text-slate-400 font-medium">
            Create catalog categories with custom emojis to organize dishes
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-black cursor-pointer hover:bg-slate-800 transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Category
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedCategories.map((category) => {
            const catId = category._id || category.id;

            return (
              <div
                key={catId}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3 transition hover:border-slate-300"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl shadow-inner shrink-0 select-none">
                      {category.emoji || '🍽️'}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 truncate">
                          {category.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            category.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {category.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1">
                          <ArrowUpDown className="w-3 h-3 text-slate-300" />
                          <span>Order: #{category.sort_order ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(category)}
                      title="Edit Category"
                      className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteConfirmId(catId);
                      }}
                      title="Delete Category"
                      className="w-8 h-8 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-500 flex items-center justify-center transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {deleteConfirmId === catId && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-rose-50 border border-rose-200">
                    <p className="text-xs font-semibold text-rose-700">
                      Delete "{category.name}"?
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmId(null);
                          setDeleteError(null);
                        }}
                        className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold cursor-pointer hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(catId)}
                        disabled={deleteCategoryMutation.isPending}
                        className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black cursor-pointer hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {deleteCategoryMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : null}
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modalMode === 'edit' ? 'Edit category' : 'Add category'}
            className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col p-6 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {modalMode === 'edit' ? `Edit Category: ${editingCategory?.name}` : 'Create Menu Category'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-rose-500" />
                    <span>Customer Chip Preview</span>
                  </span>
                  <p className="text-xs text-slate-500 font-medium">
                    This is how customers will see this category
                  </p>
                </div>

                <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl min-w-[70px] bg-white border border-slate-200 shadow-sm shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner select-none">
                    {form.emoji || '🍽️'}
                  </div>
                  <span className="text-[10px] font-black text-slate-800 tracking-tight truncate max-w-[75px]">
                    {form.name.trim() || 'Category'}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Burgers, Biryani, Pizza, Desserts"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Select Icon / Emoji *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-medium">Selected:</span>
                    <span className="text-lg leading-none select-none">{form.emoji}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={emojiSearch}
                      onChange={(e) => setEmojiSearch(e.target.value)}
                      placeholder="Search food emojis (e.g. burger, pizza, meat, tea)..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                    <span className="text-[10px] font-bold text-slate-400">Custom:</span>
                    <input
                      type="text"
                      value={form.emoji}
                      onChange={(e) => setForm((prev) => ({ ...prev, emoji: e.target.value }))}
                      maxLength={4}
                      placeholder="🍽️"
                      className="w-8 text-center text-base bg-transparent border-none focus:outline-none font-sans"
                      title="Type or paste any custom emoji"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
                  {EMOJI_GROUPS.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSelectedGroup(grp)}
                      className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition cursor-pointer ${
                        selectedGroup === grp
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 max-h-48 overflow-y-auto grid grid-cols-7 sm:grid-cols-9 gap-2">
                  {filteredEmojis.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-xs text-slate-400">
                      No matching emojis found. Use the custom input to paste any emoji.
                    </div>
                  ) : (
                    filteredEmojis.map((item) => {
                      const isSelected = form.emoji === item.char;
                      return (
                        <button
                          key={`${item.group}-${item.char}`}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, emoji: item.char }))}
                          title={item.name}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition transform hover:scale-115 active:scale-95 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-white border-2 border-rose-500 shadow-md shadow-rose-500/25 scale-105'
                              : 'hover:bg-white hover:shadow-xs border border-transparent'
                          }`}
                        >
                          {item.char}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Display Sequence Order
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sort_order: Number(e.target.value) || 0 }))
                  }
                  min="0"
                  step="1"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-400/20"
                />
                <p className="text-[10px] text-slate-400">
                  Lower numbers appear first on customer menus
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-700">Category Active</span>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Inactive categories are hidden from customer catalog
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, is_active: !prev.is_active }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    form.is_active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {form.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{modalMode === 'edit' ? 'Save Category Changes' : 'Create Category'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
