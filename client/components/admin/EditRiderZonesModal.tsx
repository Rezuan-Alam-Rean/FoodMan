// modal for admin to edit operational delivery zones for a rider
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  MapPin,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import { useUpdateAdminRiderZonesMutation } from '@/hooks/queries/use-admin-queries';

interface EditRiderZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  riderName?: string;
  initialZones?: Array<string | { _id: string; name?: string }>;
}

export function EditRiderZonesModal({
  isOpen,
  onClose,
  userId,
  riderName,
  initialZones = [],
}: EditRiderZonesModalProps) {
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: zones = [], isLoading: isLoadingZones } = useZonesQuery();
  const updateZonesMutation = useUpdateAdminRiderZonesMutation();

  useEffect(() => {
    if (isOpen) {
      const initialIds = (initialZones || []).map((z: any) =>
        typeof z === 'string' ? z : z._id
      );
      setSelectedZoneIds(initialIds);
      setSearchQuery('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, initialZones]);

  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return zones;
    const q = searchQuery.toLowerCase().trim();
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        (z.city && z.city.toLowerCase().includes(q))
    );
  }, [zones, searchQuery]);

  if (!isOpen) return null;

  const toggleZone = (zoneId: string) => {
    setSelectedZoneIds((prev) =>
      prev.includes(zoneId)
        ? prev.filter((id) => id !== zoneId)
        : [...prev, zoneId]
    );
  };

  const handleSelectAll = () => {
    setSelectedZoneIds(zones.map((z) => z._id));
  };

  const handleClearAll = () => {
    setSelectedZoneIds([]);
  };

  const handleSave = () => {
    setError('');
    updateZonesMutation.mutate(
      {
        userId,
        zone_ids: selectedZoneIds,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 1200);
        },
        onError: (err: any) => {
          setError(err.message || 'Failed to update delivery zones');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Manage Delivery Zones
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                {riderName ? `Rider: ${riderName}` : 'Assign operational delivery zones'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <div className="w-14 h-14 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-base font-black text-slate-900">
              Delivery Zones Updated!
            </p>
            <p className="text-xs text-slate-500">
              Assigned {selectedZoneIds.length} zone(s) successfully.
            </p>
          </div>
        ) : (
          <div className="flex flex-col p-6 gap-4 overflow-hidden">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search available zones..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-2 rounded-xl text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition whitespace-nowrap cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-2 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition whitespace-nowrap cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">
                {selectedZoneIds.length} of {zones.length} zone(s) assigned
              </span>
              {selectedZoneIds.length === 0 && (
                <span className="text-[11px] text-amber-600 font-bold">
                  (Rider will have no active zones)
                </span>
              )}
            </div>

            <div className="overflow-y-auto max-h-[320px] space-y-2 pr-1">
              {isLoadingZones ? (
                <div className="flex items-center justify-center py-12 gap-2 text-xs font-semibold text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading zones...</span>
                </div>
              ) : filteredZones.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                  No zones match your search.
                </div>
              ) : (
                filteredZones.map((zone) => {
                  const isSelected = selectedZoneIds.includes(zone._id);
                  return (
                    <button
                      key={zone._id}
                      type="button"
                      onClick={() => toggleZone(zone._id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs font-black">{zone.name}</p>
                          {zone.city && (
                            <p className="text-[10px] text-slate-400 font-medium">
                              {zone.city}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={updateZonesMutation.isPending}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateZonesMutation.isPending}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              >
                {updateZonesMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Zones</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
