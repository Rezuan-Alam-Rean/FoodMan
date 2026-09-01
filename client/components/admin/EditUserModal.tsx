// edit user modal for admin to update user info, passwords, and partner settings
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Bike,
  Store,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Phone,
  Mail,
  MapPin,
  Edit,
} from 'lucide-react';
import { useUpdateAdminUserMutation } from '@/hooks/queries/use-admin-queries';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
}

const VEHICLE_TYPES = [
  { value: 'MOTORCYCLE', label: 'Motorcycle' },
  { value: 'BICYCLE', label: 'Bicycle' },
  { value: 'SCOOTER', label: 'Scooter' },
  { value: 'CAR', label: 'Car' },
];

export function EditUserModal({ isOpen, onClose, userData }: EditUserModalProps) {
  const user = userData?.user || userData;
  const riderProfile = userData?.riderProfile || userData?.rider;
  const restaurantProfile = userData?.restaurantProfile || userData?.restaurant;

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // rider fields
  const [vehicleType, setVehicleType] = useState('MOTORCYCLE');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [cashLimit, setCashLimit] = useState('3000');
  const [isOnline, setIsOnline] = useState(false);

  // restaurant fields
  const [restaurantName, setRestaurantName] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [commissionRate, setCommissionRate] = useState('10');
  const [description, setDescription] = useState('');
  const [isOpenNow, setIsOpenNow] = useState(true);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: zones = [] } = useZonesQuery();
  const updateMutation = useUpdateAdminUserMutation();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phone_number || '');
      setEmail(user.email || '');
      setPassword('');

      if (riderProfile) {
        setVehicleType(riderProfile.vehicle_type || 'MOTORCYCLE');
        setDrivingLicense(riderProfile.driving_license_no || '');
        setNidNumber(riderProfile.nid_number || '');
        const currentZones = Array.isArray(riderProfile.assigned_zones)
          ? riderProfile.assigned_zones.map((z: any) => (typeof z === 'string' ? z : z._id))
          : [];
        setSelectedZones(currentZones);
        setCashLimit(String(riderProfile.cash_in_hand_limit || 3000));
        setIsOnline(Boolean(riderProfile.is_online));
      }

      if (restaurantProfile) {
        setRestaurantName(restaurantProfile.name || '');
        const zId = typeof restaurantProfile.zone_id === 'string'
          ? restaurantProfile.zone_id
          : restaurantProfile.zone_id?._id || '';
        setZoneId(zId);
        setRestaurantAddress(restaurantProfile.address || '');
        setCommissionRate(String(restaurantProfile.commission_rate ?? 10));
        setDescription(restaurantProfile.description || '');
        setIsOpenNow(restaurantProfile.is_open ?? true);
      }
    }
  }, [user, riderProfile, restaurantProfile]);

  if (!isOpen || !user) return null;

  const role = user.role;

  const toggleZone = (zId: string) => {
    setSelectedZones((prev) =>
      prev.includes(zId) ? prev.filter((id) => id !== zId) : [...prev, zId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('full name is required');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('phone number is required');
      return;
    }
    if (password.trim() && password.trim().length < 6) {
      setError('new password must be at least 6 characters');
      return;
    }

    updateMutation.mutate(
      {
        userId: user._id,
        payload: {
          name: name.trim(),
          phone_number: phoneNumber.trim(),
          email: email.trim(),
          password: password.trim() || undefined,
          vehicle_type: role === 'RIDER' ? vehicleType : undefined,
          driving_license_no: role === 'RIDER' ? drivingLicense.trim() || undefined : undefined,
          nid_number: role === 'RIDER' ? nidNumber.trim() || undefined : undefined,
          assigned_zones: role === 'RIDER' ? selectedZones : undefined,
          cash_in_hand_limit: role === 'RIDER' ? Number(cashLimit) || 3000 : undefined,
          is_online: role === 'RIDER' ? isOnline : undefined,
          restaurant_name: role === 'RESTAURANT_OWNER' ? restaurantName.trim() : undefined,
          zone_id: role === 'RESTAURANT_OWNER' ? zoneId : undefined,
          restaurant_address: role === 'RESTAURANT_OWNER' ? restaurantAddress.trim() : undefined,
          commission_rate: role === 'RESTAURANT_OWNER' ? Number(commissionRate) || 10 : undefined,
          description: role === 'RESTAURANT_OWNER' ? description.trim() : undefined,
          is_open: role === 'RESTAURANT_OWNER' ? isOpenNow : undefined,
        },
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 1400);
        },
        onError: (err: any) => {
          setError(err.message || 'failed to update user');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Edit className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Edit User Account</h2>
              <p className="text-[11px] text-slate-400 font-medium">{role}: {user.name}</p>
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
              <CheckCircle className="w-7 h-7" />
            </div>
            <p className="text-base font-black text-slate-900">User Profile Updated!</p>
            <p className="text-xs text-slate-500">All changes saved successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  Reset Password <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                  />
                </div>
              </div>
            </div>

            {role === 'RIDER' && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
                    <Bike className="w-4 h-4 text-indigo-600" />
                    <span>Rider Courier Specifications</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOnline(!isOnline)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                      isOnline ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-900 uppercase">Vehicle Type</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                    >
                      {VEHICLE_TYPES.map((v) => (
                        <option key={v.value} value={v.value}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-900 uppercase">Cash Limit (BDT)</label>
                    <input
                      type="number"
                      value={cashLimit}
                      onChange={(e) => setCashLimit(e.target.value)}
                      min="500"
                      step="500"
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-900 uppercase">Driving License</label>
                    <input
                      type="text"
                      value={drivingLicense}
                      onChange={(e) => setDrivingLicense(e.target.value)}
                      placeholder="DL-12345"
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-900 uppercase">NID Number</label>
                    <input
                      type="text"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      placeholder="1990123456789"
                      className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-indigo-900 uppercase">Assigned Delivery Zones</label>
                  <div className="flex flex-wrap gap-1.5">
                    {zones.map((z) => {
                      const isAssigned = selectedZones.includes(z._id);
                      return (
                        <button
                          key={z._id}
                          type="button"
                          onClick={() => toggleZone(z._id)}
                          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            isAssigned
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{z.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {role === 'RESTAURANT_OWNER' && (
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-900 font-black text-xs">
                    <Store className="w-4 h-4 text-rose-600" />
                    <span>Restaurant Profile Details</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpenNow(!isOpenNow)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition cursor-pointer ${
                      isOpenNow ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isOpenNow ? 'Store Open' : 'Store Closed'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-rose-900 uppercase">Restaurant Name</label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-rose-900 uppercase">Primary Zone</label>
                    <select
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                    >
                      <option value="">Select a zone...</option>
                      {zones.map((z) => (
                        <option key={z._id} value={z._id}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-rose-900 uppercase">Physical Address</label>
                    <input
                      type="text"
                      value={restaurantAddress}
                      onChange={(e) => setRestaurantAddress(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-rose-900 uppercase">Commission (%)</label>
                    <input
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-rose-900 uppercase">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-slate-900 text-xs font-bold focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 mt-2"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{updateMutation.isPending ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
