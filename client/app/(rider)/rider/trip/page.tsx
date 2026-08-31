// active delivery trip execution page on /rider/trip
'use client';

import React from 'react';
import Link from 'next/link';
import { useRiderProfileQuery } from '@/hooks/queries/use-rider-queries';
import { ActiveDeliveryCard } from '@/components/rider/ActiveDeliveryCard';
import {
  Radar,
  Loader2,
  Package,
} from 'lucide-react';

export default function RiderTripPage() {
  const { data: profileData, isLoading: isProfileLoading } = useRiderProfileQuery();

  const rider = profileData?.rider;
  const activeDelivery = profileData?.active_delivery;

  if (isProfileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">Loading Active Trip...</p>
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
    <div className="space-y-5 pb-6">
      {activeDelivery ? (
        <ActiveDeliveryCard order={activeDelivery} />
      ) : (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900">No Active Delivery</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              You do not have any delivery task in progress right now.
            </p>
          </div>
          <Link
            href="/rider"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition shadow-sm cursor-pointer"
          >
            <Radar className="w-4 h-4" />
            <span>Go to Radar Feed</span>
          </Link>
        </div>
      )}
    </div>
  );
}
