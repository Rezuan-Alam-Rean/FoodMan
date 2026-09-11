// operational delivery zones selector modal for couriers
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import { useUpdateRiderZonesMutation } from '@/hooks/queries/use-rider-queries';
import type { Rider, Zone } from '@/types';
import { MapPin, X, Check, Loader2 } from 'lucide-react';

interface RiderZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  rider: Rider;
}

export function RiderZoneModal({ isOpen, onClose, rider }: RiderZoneModalProps) {
  const { data: zones = [], isLoading: isZonesLoading } = useZonesQuery();
  const updateZonesMutation = useUpdateRiderZonesMutation();

  const initialZoneIds = useMemo(() => {
    return Array.isArray(rider.assigned_zones)
      ? rider.assigned_zones.map((z: any) => (typeof z === 'string' ? z : z._id || z.id))
      : [];
  }, [rider.assigned_zones]);

  const [selectedIds, setSelectedIds] = useState<string[]>(initialZoneIds);
  const [error, setError] = useState('');

  // reset draft selection on open or cancel
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialZoneIds);
      setError('');
    }
  }, [isOpen, initialZoneIds]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedIds(initialZoneIds);
    setError('');
    onClose();
  };

  const toggleZone = (id: string) => {
    setError('');
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) {
        setError('you must have at least one operational zone assigned');
        return;
      }
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = () => {
    if (selectedIds.length === 0) {
      setError('please select at least one delivery zone');
      return;
    }
    setError('');
    updateZonesMutation.mutate(selectedIds, {
      onSuccess: () => {
        onClose();
      },
      onError: (err: any) => {
        setError(err.message || 'failed to update operational delivery zones');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 shadow-2xl border-t sm:border border-slate-200/80 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden -mt-1 mb-2" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 leading-tight truncate">Operational Zones</h2>
              <p className="text-xs text-slate-400 truncate">Select delivery areas you wish to cover</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-transform flex items-center justify-center cursor-pointer shrink-0 active:scale-[0.98]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-in shake duration-200">
            {error}
          </div>
        )}

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {isZonesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />
            </div>
          ) : (
            zones.map((zone: Zone) => {
              const zoneId = zone.id || (zone as any)._id;
              const isSelected = selectedIds.includes(zoneId);

              return (
                <button
                  key={zoneId}
                  type="button"
                  onClick={() => toggleZone(zoneId)}
                  className={`w-full min-h-[52px] p-3.5 rounded-2xl border text-left transition-transform duration-150 flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50/60 text-slate-900 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-900">{zone.name}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Fixed delivery fee: ৳{zone.fixed_delivery_fee}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected ? 'bg-rose-600 text-white shadow-xs' : 'border-2 border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 min-h-[44px] h-12 rounded-2xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-transform cursor-pointer active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={updateZonesMutation.isPending}
            onClick={handleSave}
            className="flex-1 min-h-[44px] h-12 rounded-2xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition-transform shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {updateZonesMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Save Zones'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
