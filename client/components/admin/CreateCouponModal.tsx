// modal for admin to provision restaurant-specific discount coupons
'use client';

import React, { useState } from 'react';
import {
  X,
  Tag,
  Percent,
  Banknote,
  Store,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  Plus,
} from 'lucide-react';
import { useRestaurantsQuery } from '@/hooks/queries/use-restaurant-queries';
import { useCreateCouponMutation } from '@/hooks/queries/use-coupon-queries';
import type { DiscountType } from '@/types';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRestaurantId?: string;
}

export function CreateCouponModal({
  isOpen,
  onClose,
  preselectedRestaurantId,
}: CreateCouponModalProps) {
  const { data: restaurants = [], isLoading: isRestaurantsLoading } = useRestaurantsQuery();
  const createMutation = useCreateCouponMutation();

  const [restaurantId, setRestaurantId] = useState(preselectedRestaurantId || '');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number | ''>(10);
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>(0);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState<number | ''>('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number | ''>(1);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please provide a coupon code');
      return;
    }

    if (!restaurantId) {
      setError('Please select a restaurant');
      return;
    }

    const dVal = Number(discountValue);
    if (isNaN(dVal) || dVal <= 0) {
      setError('Discount value must be greater than 0');
      return;
    }

    if (discountType === 'PERCENTAGE' && dVal > 100) {
      setError('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      await createMutation.mutateAsync({
        code: trimmedCode,
        restaurant_id: restaurantId,
        title: title.trim() || `${trimmedCode} Promo`,
        description: description.trim(),
        discount_type: discountType,
        discount_value: dVal,
        min_order_amount: Number(minOrderAmount) || 0,
        max_discount_amount:
          maxDiscountAmount !== '' && maxDiscountAmount !== null
            ? Number(maxDiscountAmount)
            : null,
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
        usage_limit: usageLimit !== '' && usageLimit !== null ? Number(usageLimit) : null,
        usage_limit_per_user:
          usageLimitPerUser !== '' && usageLimitPerUser !== null
            ? Number(usageLimitPerUser)
            : null,
        is_active: isActive,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create coupon');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs shrink-0">
              <Tag className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">Create Coupon</h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate">Set discount promo for restaurant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Restaurant Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-rose-600" />
              <span>Target Restaurant *</span>
            </label>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              required
              disabled={isRestaurantsLoading}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 cursor-pointer"
            >
              <option value="">Select a restaurant...</option>
              {restaurants.map((r) => (
                <option key={r.id || r._id} value={r.id || r._id}>
                  {r.name} ({r.address || 'Dhaka'})
                </option>
              ))}
            </select>
          </div>

          {/* Code & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Coupon Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. BURGER20"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-mono text-xs font-black uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1 min-w-0">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Promo Title (Optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 20% Weekend Promo"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Discount Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Discount Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType('PERCENTAGE')}
                className={`p-2.5 rounded-2xl border text-left transition flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 cursor-pointer ${
                  discountType === 'PERCENTAGE'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Percent className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
                <span className="text-xs font-bold truncate">Percentage (%)</span>
              </button>

              <button
                type="button"
                onClick={() => setDiscountType('FLAT')}
                className={`p-2.5 rounded-2xl border text-left transition flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 cursor-pointer ${
                  discountType === 'FLAT'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-3.5 sm:w-4 h-3.5 sm:h-4 shrink-0" />
                <span className="text-xs font-bold truncate">Flat Amount (৳)</span>
              </button>
            </div>
          </div>

          {/* Discount Value & Min Bill */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                {discountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Discount Amount (৳) *'}
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                min="1"
                max={discountType === 'PERCENTAGE' ? 100 : undefined}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Min Order Bill (৳)
              </label>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value === '' ? '' : Number(e.target.value))}
                min="0"
                placeholder="0 (No minimum)"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Max Cap (if percentage) & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {discountType === 'PERCENTAGE' && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Max Discount Cap (৳) (Optional)
                </label>
                <input
                  type="number"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  min="0"
                  placeholder="e.g. 100 (No cap)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            )}

            <div className={`space-y-1 ${discountType !== 'PERCENTAGE' ? 'sm:col-span-2' : ''}`}>
              <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Expiration Date (Optional)</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Total Usage Limit (Optional)
              </label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value === '' ? '' : Number(e.target.value))}
                min="1"
                placeholder="Unlimited"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Limit Per Customer
              </label>
              <input
                type="number"
                value={usageLimitPerUser}
                onChange={(e) => setUsageLimitPerUser(e.target.value === '' ? '' : Number(e.target.value))}
                min="1"
                placeholder="1 (Default)"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          {/* Active Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-900">Activate Immediately</p>
              <p className="text-[10px] text-slate-400">Coupon will be redeemable by customers right away</p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50 mt-2"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>{createMutation.isPending ? 'Creating Coupon...' : 'Create Discount Coupon'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
