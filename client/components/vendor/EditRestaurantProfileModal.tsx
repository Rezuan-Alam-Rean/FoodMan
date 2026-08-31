// modal dialog for updating restaurant outlet name, address, and primary zone
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import { useUpdateRestaurantProfileMutation } from '@/hooks/queries/use-restaurant-queries';
import type { Restaurant } from '@/types';
import {
  X,
  Store,
  MapPin,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  Building2,
  FileText,
} from 'lucide-react';

interface EditRestaurantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: Restaurant;
}

export function EditRestaurantProfileModal({
  isOpen,
  onClose,
  restaurant,
}: EditRestaurantProfileModalProps) {
  const restaurantId = restaurant.id || restaurant._id;
  const initialZoneId =
    typeof restaurant.zone_id === 'object'
      ? (restaurant.zone_id as any)?._id || (restaurant.zone_id as any)?.id
      : (restaurant.zone_id as string) || '';

  const [name, setName] = useState(restaurant.name || '');
  const [address, setAddress] = useState(restaurant.address || '');
  const [zoneId, setZoneId] = useState(initialZoneId);
  const [description, setDescription] = useState(restaurant.description || '');
  const [error, setError] = useState('');
  const [isZoneOpen, setIsZoneOpen] = useState(false);

  const zoneDropdownRef = useRef<HTMLDivElement>(null);

  const { data: zones = [], isLoading: isZonesLoading } = useZonesQuery();
  const updateMutation = useUpdateRestaurantProfileMutation();

  useEffect(() => {
    if (restaurant) {
      const currentZoneId =
        typeof restaurant.zone_id === 'object'
          ? (restaurant.zone_id as any)?._id || (restaurant.zone_id as any)?.id
          : (restaurant.zone_id as string) || '';

      setName(restaurant.name || '');
      setAddress(restaurant.address || '');
      setZoneId(currentZoneId);
      setDescription(restaurant.description || '');
      setError('');
    }
  }, [restaurant, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        zoneDropdownRef.current &&
        !zoneDropdownRef.current.contains(event.target as Node)
      ) {
        setIsZoneOpen(false);
      }
    };
    if (isZoneOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isZoneOpen]);

  if (!isOpen) return null;

  const selectedZone =
    zones.find((z) => (z.id || z._id) === zoneId) ||
    (typeof restaurant.zone_id === 'object' ? restaurant.zone_id : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('restaurant name is required');
      return;
    }

    if (!address.trim()) {
      setError('restaurant address is required');
      return;
    }

    if (!zoneId) {
      setError('primary operating zone is required');
      return;
    }

    updateMutation.mutate(
      {
        restaurantId,
        updates: {
          name: name.trim(),
          address: address.trim(),
          zone_id: zoneId,
          description: description.trim(),
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'failed to update restaurant profile');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="w-12 h-1.5 rounded-full bg-slate-200 mx-auto mb-3 sm:hidden shrink-0" />

        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 leading-tight truncate">
                Edit Outlet Profile
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Update restaurant name, physical address, and operating zone
              </p>
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

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto overflow-x-hidden pr-1 py-3 sm:py-4 space-y-4 flex-1"
        >
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Restaurant / Outlet Name *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Store className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sultan's Dine & Lounge"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          <div className="space-y-1 relative" ref={zoneDropdownRef}>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Primary Operating Zone *
            </label>

            <button
              type="button"
              onClick={() => setIsZoneOpen((prev) => !prev)}
              className={`w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border text-left text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                isZoneOpen
                  ? 'border-rose-500 ring-2 ring-rose-500/20 bg-white shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-3 h-3" />
                </div>
                <span className="truncate text-slate-900 font-extrabold">
                  {(selectedZone as any)?.name || (isZonesLoading ? 'Loading zones...' : 'Select a Zone')}
                </span>
                {(selectedZone as any)?.city && (
                  <span className="text-[10px] font-medium text-slate-400">
                    ({(selectedZone as any)?.city})
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isZoneOpen ? 'rotate-180 text-rose-600' : ''
                }`}
              />
            </button>

            {isZoneOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-30 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 space-y-0.5 max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                {zones.map((zone) => {
                  const zId = zone.id || zone._id;
                  const isSelected = zId === zoneId;

                  return (
                    <button
                      key={zId}
                      type="button"
                      onClick={() => {
                        setZoneId(zId);
                        setIsZoneOpen(false);
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
                        <span className="truncate">{zone.name}</span>
                        {zone.city && (
                          <span className="text-[10px] font-medium text-slate-400">
                            • {zone.city}
                          </span>
                        )}
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

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Physical Outlet Address *
            </label>
            <div className="relative">
              <span className="absolute top-3 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <Building2 className="w-4 h-4" />
              </span>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Satmasjid Road, Dhanmondi, Dhaka"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Outlet Description / Cuisine Story
            </label>
            <div className="relative">
              <span className="absolute top-3 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                <FileText className="w-4 h-4" />
              </span>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Share your culinary specialty, heritage recipes, or operating motto..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
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
            disabled={updateMutation.isPending}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
