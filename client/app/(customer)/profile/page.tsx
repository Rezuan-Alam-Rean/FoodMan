// customer account profile and saved address management page
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useZoneStore } from '@/lib/store/zone-store';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import {
  useAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '@/hooks/queries/use-address-queries';
import { SetPasswordModal } from '@/components/auth/SetPasswordModal';
import { formatBDT } from '@/lib/utils';
import {
  User,
  Phone,
  Mail,
  MapPin,
  LogOut,
  ReceiptText,
  Sparkles,
  Plus,
  Trash2,
  Home,
  Briefcase,
  Navigation,
  Lock,
  AlertTriangle,
} from 'lucide-react';

export default function CustomerProfilePage() {
  const { user, role, isAuthenticated, isLoading, logout } = useAuth();
  const { selectedZone, setSelectedZone } = useZoneStore();
  const { data: zones = [] } = useZonesQuery();
  const { data: addresses = [] } = useAddressesQuery(isAuthenticated);

  const createAddressMutation = useCreateAddressMutation();
  const updateAddressMutation = useUpdateAddressMutation();
  const deleteAddressMutation = useDeleteAddressMutation();

  // add address form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newZoneId, setNewZoneId] = useState('');
  const [newSubzoneId, setNewSubzoneId] = useState('');
  const [newDetailedAddress, setNewDetailedAddress] = useState('');
  const [newLabel, setNewLabel] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');
  const [formError, setFormError] = useState('');

  // sync selectedZone in store with default address
  React.useEffect(() => {
    const defaultAddr = addresses.find((a) => a.is_default);
    if (defaultAddr && defaultAddr.zone_id) {
      const zoneId =
        typeof defaultAddr.zone_id === 'object'
          ? (defaultAddr.zone_id as any)._id || (defaultAddr.zone_id as any).id
          : defaultAddr.zone_id;
      const currentSelectedId = selectedZone?.id || selectedZone?._id;

      if (zoneId && String(zoneId) !== String(currentSelectedId)) {
        const zoneObj = zones.find((z) => String(z.id || z._id) === String(zoneId));
        if (zoneObj) setSelectedZone(zoneObj);
      }
    }
  }, [addresses, zones, selectedZone, setSelectedZone]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-xs">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-slate-500">
            Access your profile, saved addresses, and active orders.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-rose-600/20 transition active:scale-95"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const targetZoneId = newZoneId || (zones[0]?.id || zones[0]?._id);
    const activeZone = zones.find((z) => (z.id || z._id) === targetZoneId) || zones[0];
    const targetSubzoneId = newSubzoneId || (activeZone?.subzones?.[0]?.id || activeZone?.subzones?.[0]?._id);

    if (!targetZoneId || !targetSubzoneId || !newDetailedAddress.trim()) {
      setFormError('Please select both a delivery zone and subzone, and provide detailed street address.');
      return;
    }

    try {
      await createAddressMutation.mutateAsync({
        zone_id: targetZoneId,
        subzone_id: targetSubzoneId,
        detailed_address: newDetailedAddress.trim(),
        address_label: newLabel,
        is_default: addresses.length === 0,
      });

      // sync active zone in store
      if (activeZone) setSelectedZone(activeZone);

      setNewDetailedAddress('');
      setIsAddingAddress(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save address.');
    }
  };

  const handleMakeDefault = async (addressId: string) => {
    try {
      await updateAddressMutation.mutateAsync({
        id: addressId,
        updates: { is_default: true },
      });
      const target = addresses.find((a) => (a.id || a._id) === addressId);
      if (target && target.zone_id) {
        const zoneObj = typeof target.zone_id === 'object' ? target.zone_id : zones.find((z) => (z.id || z._id) === target.zone_id);
        if (zoneObj) setSelectedZone(zoneObj as any);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteAddressMutation.mutateAsync(addressId);
    } catch (err) {
      console.error(err);
    }
  };

  const activeAddZone = zones.find((z) => (z.id || z._id) === (newZoneId || zones[0]?.id || zones[0]?._id)) || zones[0];

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
            {(user.name || user.phone_number || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 tracking-tight truncate">
                {user.name || 'FoodMan Customer'}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                {role || 'Customer'}
              </span>
            </div>
            <p className="text-xs font-mono font-medium text-slate-500 mt-0.5">
              {user.phone_number}
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 pt-3 border-t border-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name</span>
            </span>
            <span className="font-bold text-slate-800">{user.name || 'Not specified'}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Mobile Number</span>
            </span>
            <span className="font-mono font-bold text-slate-800">{user.phone_number}</span>
          </div>

          {user.email ? (
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </span>
              <span className="font-bold text-slate-800">{user.email}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-xs tracking-tight">Saved Delivery Addresses</h3>
              <p className="text-[11px] text-slate-400">Stored in your account database for fast checkout</p>
            </div>
          </div>

          {!isAddingAddress && (
            <button
              onClick={() => {
                setIsAddingAddress(true);
                if (zones.length > 0 && !newZoneId) {
                  const firstZ = zones[0];
                  setNewZoneId(firstZ.id || firstZ._id);
                  if (firstZ.subzones && firstZ.subzones.length > 0) {
                    setNewSubzoneId(firstZ.subzones[0].id || firstZ.subzones[0]._id);
                  }
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New</span>
            </button>
          )}
        </div>

        {isAddingAddress && (
          <form onSubmit={handleCreateAddress} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Add New Delivery Address</span>
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <p className="text-[11px] text-rose-600 font-semibold">{formError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Delivery Zone *</label>
                <select
                  value={newZoneId || (zones[0]?.id || zones[0]?._id || '')}
                  onChange={(e) => {
                    setNewZoneId(e.target.value);
                    const selectedZ = zones.find((z) => (z.id || z._id) === e.target.value);
                    if (selectedZ && selectedZ.subzones && selectedZ.subzones.length > 0) {
                      setNewSubzoneId(selectedZ.subzones[0].id || selectedZ.subzones[0]._id);
                    } else {
                      setNewSubzoneId('');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden cursor-pointer"
                >
                  {zones.map((z) => (
                    <option key={z.id || z._id} value={z.id || z._id}>
                      {z.name} (Fixed: {formatBDT(z.fixed_delivery_fee)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Subzone (Area / Sector) *</label>
                <select
                  value={newSubzoneId || (activeAddZone?.subzones?.[0]?.id || activeAddZone?.subzones?.[0]?._id || '')}
                  onChange={(e) => setNewSubzoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:outline-hidden cursor-pointer"
                >
                  {activeAddZone?.subzones?.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name} {s.custom_fixed_fee ? `(৳${s.custom_fixed_fee})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Street Address *</label>
              <textarea
                rows={2}
                value={newDetailedAddress}
                onChange={(e) => setNewDetailedAddress(e.target.value)}
                placeholder="e.g. Flat 3B, House 12, Road 4, Sector 7"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Address Label</label>
              <div className="grid grid-cols-3 gap-2">
                {(['HOME', 'WORK', 'OTHER'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setNewLabel(l)}
                    className={`py-1.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      newLabel === l
                        ? 'border-rose-600 bg-rose-50 text-rose-600'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {l === 'HOME' && <Home className="w-3.5 h-3.5" />}
                    {l === 'WORK' && <Briefcase className="w-3.5 h-3.5" />}
                    {l === 'OTHER' && <Sparkles className="w-3.5 h-3.5" />}
                    <span>{l}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={createAddressMutation.isPending}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {createAddressMutation.isPending ? 'Saving...' : 'Save to Address Book'}
            </button>
          </form>
        )}

        {addresses.length === 0 && !isAddingAddress ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-1.5">
            <p className="text-xs font-bold text-slate-700">No saved addresses yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Add your delivery address above, or it will be automatically saved to your account when you place your first order.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {addresses.map((addr) => {
              const zoneName = typeof addr.zone_id === 'object' ? addr.zone_id?.name : 'Dhaka';
              const subzoneName = typeof addr.subzone_id === 'object' ? addr.subzone_id?.name : '';
              const zoneFee = typeof addr.zone_id === 'object' ? (addr.zone_id as any)?.fixed_delivery_fee : null;

              return (
                <div
                  key={addr.id || addr._id}
                  className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                    addr.is_default
                      ? 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-300/60'
                      : 'border-slate-200 bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-900 text-white">
                        {addr.address_label || 'HOME'}
                      </span>
                      {addr.is_default && (
                        <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">
                          Default
                        </span>
                      )}
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-rose-500" />
                        {zoneName} {subzoneName ? `• ${subzoneName}` : ''} {zoneFee !== null && `(৳${zoneFee})`}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {addr.detailed_address}
                    </p>

                    <p className="text-[11px] text-slate-500 font-mono">
                      {addr.contact_person_name} • {addr.contact_phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.is_default && (
                      <button
                        onClick={() => handleMakeDefault(addr.id || addr._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition cursor-pointer"
                        title="Set as default address"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(addr.id || addr._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-3 shadow-xs">
        <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Account Settings</h3>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>{user?.has_password ? 'Change Password' : 'Set Account Password'}</span>
            </div>
            <span className="text-slate-400">→</span>
          </button>

          <Link
            href="/orders"
            className="p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-between text-xs font-bold text-slate-800"
          >
            <div className="flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-rose-600" />
              <span>Order History & Receipts</span>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
        </div>
      </div>

      {user?.has_password === false && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200/80 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Guest Account Notice</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
            This account was automatically created during guest checkout and does not have a password set yet. If you log out now without setting a password, you won&apos;t be able to sign in directly (you would have to place another order via checkout with this phone number to access this account).
          </p>
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Set a Password Now</span>
          </button>
        </div>
      )}

      <button
        onClick={() => logout()}
        className="w-full py-3 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out</span>
      </button>

      <SetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
