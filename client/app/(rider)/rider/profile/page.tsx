// rider account profile and credentials page on /rider/profile
'use client';

import React from 'react';
import { useRiderProfileQuery } from '@/hooks/queries/use-rider-queries';
import { RiderProfileCard } from '@/components/rider/RiderProfileCard';
import { Loader2 } from 'lucide-react';

export default function RiderProfilePage() {
  const { data: profileData, isLoading: isProfileLoading } = useRiderProfileQuery();
  const rider = profileData?.rider;

  if (isProfileLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">Loading Profile...</p>
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
      <RiderProfileCard rider={rider} />
    </div>
  );
}
