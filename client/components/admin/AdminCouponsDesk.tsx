// dedicated admin coupons and order discount desk
'use client';

import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  Store,
  Percent,
  Banknote,
  Calendar,
  Layers,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  useAdminCouponsQuery,
  useToggleCouponStatusMutation,
  useDeleteCouponMutation,
} from '@/hooks/queries/use-coupon-queries';
import { useRestaurantsQuery } from '@/hooks/queries/use-restaurant-queries';
import { CreateCouponModal } from './CreateCouponModal';
import { EditCouponModal } from './EditCouponModal';
import { formatBDT } from '@/lib/utils';
import type { Coupon } from '@/types';

export function AdminCouponsDesk() {
  const [search, setSearch] = useState('');
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: restaurants = [] } = useRestaurantsQuery();

  const queryParams: any = {};
  if (search.trim()) queryParams.search = search.trim();
  if (selectedRestaurantId) queryParams.restaurant_id = selectedRestaurantId;
  if (statusFilter === 'active') queryParams.is_active = true;
  if (statusFilter === 'inactive') queryParams.is_active = false;

  const { data, isLoading, error } = useAdminCouponsQuery(queryParams);
  const toggleStatusMutation = useToggleCouponStatusMutation();
  const deleteMutation = useDeleteCouponMutation();

  const coupons = data?.coupons || [];
  const totalCount = data?.pagination?.total || 0;
  const activeCount = coupons.filter((c) => c.is_active).length;
  const totalUses = coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0);

  const handleDelete = async (coupon: Coupon) => {
    const code = coupon.code;
    const isConfirmed = window.confirm(`Are you sure you want to delete coupon "${code}"?`);
    if (!isConfirmed) return;

    try {
      setDeletingId(coupon.id || coupon._id);
      await deleteMutation.mutateAsync(coupon.id || coupon._id);
    } catch (err: any) {
      alert(err.message || 'Failed to delete coupon');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Discounts & Coupons
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold">
              Manage restaurant promo codes and discount rules
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Coupons
          </span>
          <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">{totalCount}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Promos
          </span>
          <span className="text-base sm:text-lg font-black text-emerald-600 mt-0.5 block">{activeCount}</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Redemptions
          </span>
          <span className="text-base sm:text-lg font-black text-indigo-600 mt-0.5 block">{totalUses}</span>
        </div>
      </div>

      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search coupon code..."
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-base sm:text-xs font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>

          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="min-h-[44px] px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-base sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
          >
            <option value="">All Restaurants</option>
            {restaurants.map((r) => (
              <option key={r.id || r._id} value={r.id || r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer active:scale-95 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
          <p className="text-xs font-bold">Loading coupons...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Failed to load coupons. Please try again.</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">No coupons found</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Create a coupon for a restaurant to offer bill discounts to customers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Coupon</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const rest =
              typeof coupon.restaurant_id === 'object' && coupon.restaurant_id
                ? coupon.restaurant_id
                : null;
            const isToggling =
              toggleStatusMutation.isPending &&
              toggleStatusMutation.variables === (coupon.id || coupon._id);
            const isDeleting = deletingId === (coupon.id || coupon._id);

            return (
              <div
                key={coupon.id || coupon._id}
                className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 font-mono font-black text-sm">
                      %
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                          {coupon.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            coupon.discount_type === 'PERCENTAGE'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {coupon.discount_type === 'PERCENTAGE'
                            ? `${coupon.discount_value}% OFF`
                            : `৳${coupon.discount_value} FLAT`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            coupon.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mt-0.5 truncate flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{rest?.name || 'Assigned Restaurant'}</span>
                        {coupon.title && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            • {coupon.title}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => toggleStatusMutation.mutate(coupon.id || coupon._id)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 ${
                        coupon.is_active
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                      title={coupon.is_active ? 'Deactivate coupon' : 'Activate coupon'}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : coupon.is_active ? (
                        <XCircle className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{coupon.is_active ? 'Disable' : 'Enable'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingCoupon(coupon)}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer active:scale-95"
                      title="Edit coupon"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDelete(coupon)}
                      className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition cursor-pointer disabled:opacity-50 active:scale-95"
                      title="Delete coupon"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-slate-100 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Min Bill</span>
                    <span className="font-bold text-slate-900">
                      {coupon.min_order_amount > 0 ? formatBDT(coupon.min_order_amount) : 'No Minimum'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Max Cap</span>
                    <span className="font-bold text-slate-900">
                      {coupon.max_discount_amount ? formatBDT(coupon.max_discount_amount) : 'No Cap'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Redeemed</span>
                    <span className="font-bold text-indigo-700">
                      {coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'times'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Expiry</span>
                    <span className="font-bold text-slate-700">
                      {coupon.expiry_date
                        ? new Date(coupon.expiry_date).toLocaleDateString('en-GB')
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateCouponModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        preselectedRestaurantId={selectedRestaurantId}
      />

      <EditCouponModal
        coupon={editingCoupon}
        isOpen={Boolean(editingCoupon)}
        onClose={() => setEditingCoupon(null)}
      />
    </div>
  );
}
