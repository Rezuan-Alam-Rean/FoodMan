// comprehensive rider profile, documentation, and availability management component
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToggleRiderStatusMutation } from '@/hooks/queries/use-rider-queries';
import { RiderZoneModal } from './RiderZoneModal';
import { SetPasswordModal } from '@/components/auth/SetPasswordModal';
import type { Rider } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  User,
  Phone,
  Mail,
  Bike,
  ShieldCheck,
  MapPin,
  Lock,
  LogOut,
  ChevronRight,
  Loader2,
  FileCheck,
  CreditCard,
} from 'lucide-react';

interface RiderProfileCardProps {
  rider: Rider;
}

export function RiderProfileCard({ rider }: RiderProfileCardProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const toggleStatusMutation = useToggleRiderStatusMutation();
  const isOnline = rider.is_online;
  const assignedZones = Array.isArray(rider.assigned_zones) ? rider.assigned_zones : [];

  const handleToggle = () => {
    toggleStatusMutation.mutate(!isOnline);
  };

  const vehicleType = (rider as any).vehicle_type || 'MOTORCYCLE';
  const nidNumber = (rider as any).nid_number || 'Not provided';
  const licenseNo = (rider as any).driving_license_no || 'Not provided';
  const cashLimit = Number(rider.cash_in_hand_limit) || 3000;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-rose-600/20 shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'R'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                {user?.name || 'Rider Partner'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                {user?.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Delivery Partner • ID: {user?.id?.slice(-6) || 'RIDER'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700">
            <Phone className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone Number</span>
              <span className="font-black text-slate-900">{user?.phone_number || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700">
            <Mail className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Email Address</span>
              <span className="font-black text-slate-900">{user?.email || 'rider@foodman.com'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900">Availability Status</h3>
            <p className="text-xs text-slate-400">
              {isOnline
                ? 'You are Online and receiving order broadcasts'
                : 'You are Offline and will not receive order requests'}
            </p>
          </div>

          <button
            type="button"
            disabled={toggleStatusMutation.isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-9 w-18 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
              isOnline ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'
            }`}
          >
            <span className="sr-only">Toggle online status</span>
            <span
              className={`pointer-events-none flex h-7 w-7 transform items-center justify-center rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                isOnline ? 'translate-x-9 text-emerald-600' : 'translate-x-0 text-slate-400'
              }`}
            >
              {toggleStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-[10px] font-black">{isOnline ? 'ON' : 'OFF'}</span>
              )}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Operational Delivery Zones</h3>
              <p className="text-[11px] text-slate-400">Areas where you accept delivery orders</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsZoneModalOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <span>Edit Zones</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {assignedZones.length === 0 ? (
            <p className="text-xs text-amber-600 font-semibold">
              No zones currently assigned. Tap Edit Zones to assign delivery zones.
            </p>
          ) : (
            assignedZones.map((z: any) => (
              <span
                key={typeof z === 'string' ? z : z._id || z.id}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{typeof z === 'string' ? 'Zone' : z.name}</span>
              </span>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Vehicle & Documentation</h3>
            <p className="text-[11px] text-slate-400">Verified partner credentials</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Type</span>
            <p className="font-black text-slate-900">{vehicleType}</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">COD Threshold Limit</span>
            <p className="font-black text-slate-900">{formatBDT(cashLimit)}</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">National ID (NID)</span>
            <p className="font-black text-slate-900">{nidNumber}</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Driving License</span>
            <p className="font-black text-slate-900">{licenseNo}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2">
        <button
          type="button"
          onClick={() => setIsPasswordModalOpen(true)}
          className="w-full p-3 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Change Account Password</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={() => logout(() => router.push('/auth/login'))}
          className="w-full p-3 rounded-2xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 text-xs font-bold transition flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>Log Out from Device</span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </button>
      </div>

      <RiderZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        rider={rider}
      />

      <SetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
