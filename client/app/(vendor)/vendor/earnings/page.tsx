// restaurant sales earnings, digital wallet statement, and fulfilled orders route
'use client';

import React from 'react';
import { useMyRestaurantQuery } from '@/hooks/queries/use-restaurant-queries';
import { VendorWalletCard } from '@/components/vendor/VendorWalletCard';
import { VendorCompletedOrders } from '@/components/vendor/VendorCompletedOrders';
import { Loader2, Store, AlertCircle } from 'lucide-react';

export default function VendorEarningsPage() {
  const { data: restaurant, isLoading, isError, error, refetch } = useMyRestaurantQuery();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold">Loading wallet statement...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-4 max-w-md mx-auto shadow-xs">
        <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900">Failed to Load Wallet Statement</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error?.message || 'An error occurred while fetching your earnings data.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-md mx-auto shadow-xs">
        <div className="w-14 h-14 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Store className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900">No Restaurant Profile Found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your account is not yet associated with an active restaurant profile. Please contact the platform admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      <VendorWalletCard restaurant={restaurant} />
      <VendorCompletedOrders />
    </div>
  );
}
