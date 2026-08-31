// operational delivery zones selector modal for couriers
'use client';

import React, { useState } from 'react';
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

  const initialZoneIds = Array.isArray(rider.assigned_zones)
    ? rider.assigned_zones.map((z: any) => (typeof z === 'string' ? z : z._id || z.id))
    : [];

  const [selectedIds, setSelectedIds] = useState<string[]>(initialZoneIds);
  const [error, setError] = useState('');

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">Operational Zones</h2>
              <p className="text-xs text-slate-400">Select delivery areas you wish to cover</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50/50 text-slate-900'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{zone.name}</p>
                    <p className="text-[11px] text-slate-400">
                      Fixed delivery fee: ৳{zone.fixed_delivery_fee}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
                      isSelected ? 'bg-rose-600 text-white' : 'border border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={updateZonesMutation.isPending}
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
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
