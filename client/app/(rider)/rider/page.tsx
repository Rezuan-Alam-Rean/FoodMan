// live order radar feed page for available zone delivery tasks
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRiderProfileQuery } from '@/hooks/queries/use-rider-queries';
import { AvailableOrdersRadar } from '@/components/rider/AvailableOrdersRadar';
import { RiderZoneModal } from '@/components/rider/RiderZoneModal';
import {
  Bike,
  ArrowRight,
  Loader2,
  MapPin,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function RiderRadarPage() {
  const router = useRouter();
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const { data: profileData, isLoading: isProfileLoading } = useRiderProfileQuery();

  const rider = profileData?.rider;
  const activeDelivery = profileData?.active_delivery;

  const isOnline = rider?.is_online || false;
  const hasActiveDelivery = Boolean(activeDelivery);
  const assignedZones = Array.isArray(rider?.assigned_zones) ? rider.assigned_zones : [];

  if (isProfileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">Initializing Rider Radar...</p>
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
        <p className="text-sm font-bold text-slate-800">Rider profile not found</p>
        <p className="text-xs text-slate-400">Please contact support or sign in again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 items-center flex-1 mr-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Coverage Zones:
          </span>
          {assignedZones.length === 0 ? (
            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> none assigned, tap to add
            </span>
          ) : (
            assignedZones.map((z: any) => (
              <span
                key={typeof z === 'string' ? z : z._id || z.id}
                className="px-2.5 py-0.5 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200/60"
              >
                {typeof z === 'string' ? 'Zone' : z.name}
              </span>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsZoneModalOpen(true)}
          className="p-1.5 px-2.5 rounded-xl border border-rose-100 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
          title="configure operational delivery zones"
        >
          <MapPin className="w-3.5 h-3.5 text-rose-600" />
          <span>Edit Zones</span>
          <ChevronRight className="w-3 h-3 text-rose-400" />
        </button>
      </div>

      {hasActiveDelivery && (
        <div className="p-4 rounded-3xl bg-rose-500 text-white shadow-md flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black leading-tight">Delivery in Progress</p>
              <p className="text-[11px] text-rose-100">
                Order #{activeDelivery?.order_number}
              </p>
            </div>
          </div>

          <Link
            href="/rider/trip"
            className="px-3 py-1.5 rounded-xl bg-white text-rose-600 hover:bg-rose-50 text-xs font-black transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>View Trip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <AvailableOrdersRadar
        isOnline={isOnline}
        hasActiveDelivery={hasActiveDelivery}
        onOrderAccepted={() => router.push('/rider/trip')}
      />

      <RiderZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        rider={rider}
      />
    </div>
  );
}
