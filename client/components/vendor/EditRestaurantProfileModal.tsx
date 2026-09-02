// modal dialog for updating restaurant outlet name, address, primary zone, brand logo, and cover banner
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import { useUpdateRestaurantProfileMutation } from '@/hooks/queries/use-restaurant-queries';
import { useUploadImageMutation } from '@/hooks/queries/use-upload-config-queries';
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
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Camera,
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
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url || '');
  const [coverImageUrl, setCoverImageUrl] = useState(restaurant.cover_image_url || '');

  const [isLogoManual, setIsLogoManual] = useState(false);
  const [isCoverManual, setIsCoverManual] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const [error, setError] = useState('');
  const [isZoneOpen, setIsZoneOpen] = useState(false);

  const zoneDropdownRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { data: zones = [], isLoading: isZonesLoading } = useZonesQuery();
  const updateMutation = useUpdateRestaurantProfileMutation();
  const uploadImageMutation = useUploadImageMutation();

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
      setLogoUrl(restaurant.logo_url || '');
      setCoverImageUrl(restaurant.cover_image_url || '');
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

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }

    setError('');
    setIsUploadingLogo(true);
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (result?.url) {
        setLogoUrl(result.url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo image to Cloudinary');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }

    setError('');
    setIsUploadingCover(true);
    try {
      const result = await uploadImageMutation.mutateAsync(file);
      if (result?.url) {
        setCoverImageUrl(result.url);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload cover banner to Cloudinary');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Restaurant name is required');
      return;
    }

    if (!address.trim()) {
      setError('Restaurant address is required');
      return;
    }

    if (!zoneId) {
      setError('Primary operating zone is required');
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
          logo_url: logoUrl.trim() ? logoUrl.trim() : null,
          cover_image_url: coverImageUrl.trim() ? coverImageUrl.trim() : null,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (err: any) => {
          setError(err.message || 'Failed to update restaurant profile');
        },
      }
    );
  };

  const isSaving = updateMutation.isPending || isUploadingLogo || isUploadingCover;

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
                Update restaurant details, logo, cover banner, and operating zone
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

          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleLogoSelect}
            className="hidden"
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleCoverSelect}
            className="hidden"
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Cover Banner (Wide 16:9)
              </label>
              <button
                type="button"
                onClick={() => setIsCoverManual(!isCoverManual)}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 transition"
              >
                {isCoverManual ? 'Upload file' : 'Enter URL manually'}
              </button>
            </div>

            {isCoverManual ? (
              <input
                type="url"
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/.../cover.jpg"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 placeholder:font-sans placeholder:text-slate-400"
              />
            ) : coverImageUrl ? (
              <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 h-28 w-full group">
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="px-3 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Change</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer"
                    title="Remove cover banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="w-full h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/70 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isUploadingCover ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
                    <span>Uploading banner to Cloudinary...</span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5 text-rose-500" />
                    <span className="text-xs font-bold text-slate-700">Upload Cover Banner</span>
                    <span className="text-[10px] text-slate-400">
                      Recommended 1200x500 or wide landscape photo
                    </span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Brand Logo / Avatar (Square 1:1)
              </label>
              <button
                type="button"
                onClick={() => setIsLogoManual(!isLogoManual)}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 transition"
              >
                {isLogoManual ? 'Upload file' : 'Enter URL manually'}
              </button>
            </div>

            {isLogoManual ? (
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://res.cloudinary.com/.../logo.jpg"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 placeholder:font-sans placeholder:text-slate-400"
              />
            ) : logoUrl ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-14 h-14 rounded-2xl border border-slate-200 overflow-hidden bg-white shrink-0">
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Logo Uploaded</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">
                    {logoUrl}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="p-1.5 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100/70 transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
              >
                {isUploadingLogo ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
                    <span>Uploading logo to Cloudinary...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 shadow-xs">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700">Upload Outlet Logo</p>
                      <p className="text-[10px] text-slate-400">Square 1:1 format (PNG, JPG, WEBP)</p>
                    </div>
                  </>
                )}
              </button>
            )}
          </div>

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
            disabled={isSaving}
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
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
