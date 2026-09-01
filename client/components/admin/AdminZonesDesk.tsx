// admin delivery zones and subzones logistics desk with create/update actions
'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useZonesQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useCreateSubzoneMutation,
  useUpdateSubzoneMutation,
} from '@/hooks/queries/use-zone-queries';
import { formatBDT } from '@/lib/utils';
import type { Zone, Subzone } from '@/types';

export function AdminZonesDesk() {
  const { data: zones = [], isLoading, isError, refetch } = useZonesQuery();

  // Zone Modal State
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneCity, setZoneCity] = useState('Dhaka');
  const [zoneFee, setZoneFee] = useState('100');
  const [zoneActive, setZoneActive] = useState(true);
  const [zoneError, setZoneError] = useState('');

  // Subzone Modal State
  const [isSubzoneModalOpen, setIsSubzoneModalOpen] = useState(false);
  const [parentZoneId, setParentZoneId] = useState<string>('');
  const [editingSubzone, setEditingSubzone] = useState<Subzone | null>(null);
  const [subzoneName, setSubzoneName] = useState('');
  const [customFee, setCustomFee] = useState('');
  const [subzoneActive, setSubzoneActive] = useState(true);
  const [subzoneError, setSubzoneError] = useState('');

  // Mutations
  const createZoneMutation = useCreateZoneMutation();
  const updateZoneMutation = useUpdateZoneMutation();
  const createSubzoneMutation = useCreateSubzoneMutation();
  const updateSubzoneMutation = useUpdateSubzoneMutation();

  const handleOpenCreateZone = () => {
    setEditingZone(null);
    setZoneName('');
    setZoneCity('Dhaka');
    setZoneFee('100');
    setZoneActive(true);
    setZoneError('');
    setIsZoneModalOpen(true);
  };

  const handleOpenEditZone = (z: Zone) => {
    setEditingZone(z);
    setZoneName(z.name);
    setZoneCity(z.city || 'Dhaka');
    setZoneFee(String(z.fixed_delivery_fee));
    setZoneActive(z.is_active ?? true);
    setZoneError('');
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = (e: React.FormEvent) => {
    e.preventDefault();
    setZoneError('');

    if (!zoneName.trim()) {
      setZoneError('zone name is required');
      return;
    }

    const fee = Number(zoneFee);
    if (!Number.isFinite(fee) || fee < 0) {
      setZoneError('fixed delivery fee must be a valid non-negative number');
      return;
    }

    if (editingZone) {
      updateZoneMutation.mutate(
        {
          id: editingZone._id,
          updates: {
            name: zoneName.trim(),
            city: zoneCity.trim() || 'Dhaka',
            fixed_delivery_fee: fee,
            is_active: zoneActive,
          },
        },
        {
          onSuccess: () => setIsZoneModalOpen(false),
          onError: (err: any) => setZoneError(err.message || 'failed to update zone'),
        }
      );
    } else {
      createZoneMutation.mutate(
        {
          name: zoneName.trim(),
          city: zoneCity.trim() || 'Dhaka',
          fixed_delivery_fee: fee,
        },
        {
          onSuccess: () => setIsZoneModalOpen(false),
          onError: (err: any) => setZoneError(err.message || 'failed to create zone'),
        }
      );
    }
  };

  const handleOpenCreateSubzone = (zoneId: string) => {
    setParentZoneId(zoneId);
    setEditingSubzone(null);
    setSubzoneName('');
    setCustomFee('');
    setSubzoneActive(true);
    setSubzoneError('');
    setIsSubzoneModalOpen(true);
  };

  const handleOpenEditSubzone = (zoneId: string, sub: Subzone) => {
    setParentZoneId(zoneId);
    setEditingSubzone(sub);
    setSubzoneName(sub.name);
    setCustomFee(sub.custom_fixed_fee !== null && sub.custom_fixed_fee !== undefined ? String(sub.custom_fixed_fee) : '');
    setSubzoneActive(sub.is_active ?? true);
    setSubzoneError('');
    setIsSubzoneModalOpen(true);
  };

  const handleSaveSubzone = (e: React.FormEvent) => {
    e.preventDefault();
    setSubzoneError('');

    if (!subzoneName.trim()) {
      setSubzoneError('subzone name is required');
      return;
    }

    const parsedCustomFee = customFee.trim() ? Number(customFee) : null;
    if (parsedCustomFee !== null && (!Number.isFinite(parsedCustomFee) || parsedCustomFee < 0)) {
      setSubzoneError('custom fee must be a valid number or left blank');
      return;
    }

    if (editingSubzone) {
      updateSubzoneMutation.mutate(
        {
          subzoneId: editingSubzone._id,
          updates: {
            name: subzoneName.trim(),
            custom_fixed_fee: parsedCustomFee,
            is_active: subzoneActive,
          },
        },
        {
          onSuccess: () => setIsSubzoneModalOpen(false),
          onError: (err: any) => setSubzoneError(err.message || 'failed to update subzone'),
        }
      );
    } else {
      createSubzoneMutation.mutate(
        {
          zoneId: parentZoneId,
          payload: {
            name: subzoneName.trim(),
            custom_fixed_fee: parsedCustomFee,
          },
        },
        {
          onSuccess: () => setIsSubzoneModalOpen(false),
          onError: (err: any) => setSubzoneError(err.message || 'failed to create subzone'),
        }
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">Delivery Zones & Fees</h2>
            <p className="text-[11px] text-slate-400 font-medium">operational zones, fixed fees, and subzones</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateZone}
          className="px-3.5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Zone</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-teal-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">failed to load zones</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => {
            const subzones = (zone as any).subzones || [];

            return (
              <div
                key={zone._id}
                className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-slate-900">{zone.name}</span>
                      <span className="text-xs font-bold text-slate-400">({zone.city || 'Dhaka'})</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          zone.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold">
                      Standard Fixed Delivery Fee: <span className="font-black text-slate-900">{formatBDT(zone.fixed_delivery_fee)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditZone(zone)}
                      className="w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition cursor-pointer"
                      title="Edit Zone"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCreateSubzone(zone._id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Subzone</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Operational Subzones ({subzones.length})</span>
                    </span>
                  </div>

                  {subzones.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">no subzones configured under {zone.name} yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {subzones.map((sub: Subzone) => {
                        const hasCustomFee =
                          sub.custom_fixed_fee !== null && sub.custom_fixed_fee !== undefined;

                        return (
                          <div
                            key={sub._id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{sub.name}</span>
                                {sub.is_active === false && (
                                  <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-200 px-1.5 py-0.2 rounded-sm">
                                    Off
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {hasCustomFee ? (
                                  <span className="text-teal-700 font-bold">
                                    Custom Fee: {formatBDT(sub.custom_fixed_fee!)}
                                  </span>
                                ) : (
                                  <span>Inherits {formatBDT(zone.fixed_delivery_fee)}</span>
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEditSubzone(zone._id, sub)}
                              className="w-7 h-7 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                              title="Edit Subzone"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsZoneModalOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingZone ? `Edit Zone: ${editingZone.name}` : 'Create Delivery Zone'}
              </h3>
              <button
                type="button"
                onClick={() => setIsZoneModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {zoneError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{zoneError}</span>
              </div>
            )}

            <form onSubmit={handleSaveZone} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Zone Name *</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Dhanmondi, Gulshan"
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">City</label>
                  <input
                    type="text"
                    value={zoneCity}
                    onChange={(e) => setZoneCity(e.target.value)}
                    placeholder="Dhaka"
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fixed Fee (BDT) *</label>
                  <input
                    type="number"
                    value={zoneFee}
                    onChange={(e) => setZoneFee(e.target.value)}
                    min="0"
                    step="5"
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {editingZone && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Operational Status</span>
                  <button
                    type="button"
                    onClick={() => setZoneActive(!zoneActive)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                      zoneActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {zoneActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={createZoneMutation.isPending || updateZoneMutation.isPending}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50"
              >
                {(createZoneMutation.isPending || updateZoneMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{editingZone ? 'Save Changes' : 'Create Zone'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {isSubzoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSubzoneModalOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingSubzone ? `Edit Subzone: ${editingSubzone.name}` : 'Add Subzone'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubzoneModalOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {subzoneError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{subzoneError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubzone} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Subzone Name *</label>
                <input
                  type="text"
                  value={subzoneName}
                  onChange={(e) => setSubzoneName(e.target.value)}
                  placeholder="e.g. Block A, Road 27"
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">
                  Custom Fixed Fee (BDT) <span className="text-slate-400 lowercase font-normal">— leave blank to inherit zone fee</span>
                </label>
                <input
                  type="number"
                  value={customFee}
                  onChange={(e) => setCustomFee(e.target.value)}
                  placeholder="e.g. 120 (optional)"
                  min="0"
                  step="5"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {editingSubzone && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Subzone Active</span>
                  <button
                    type="button"
                    onClick={() => setSubzoneActive(!subzoneActive)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                      subzoneActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {subzoneActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={createSubzoneMutation.isPending || updateSubzoneMutation.isPending}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50"
              >
                {(createSubzoneMutation.isPending || updateSubzoneMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>{editingSubzone ? 'Save Changes' : 'Create Subzone'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
