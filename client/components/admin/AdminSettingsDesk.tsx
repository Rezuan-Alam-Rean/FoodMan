// admin platform settings desk with tabs for platform fees/mfs, coupons/discounts, menu categories and upload endpoints
'use client';

import React, { useState } from 'react';
import { Sliders, UtensilsCrossed, Cloud, Tag } from 'lucide-react';
import { AdminPlatformConfigDesk } from './AdminPlatformConfigDesk';
import { AdminCouponsDesk } from './AdminCouponsDesk';
import { AdminCategoryDesk } from './AdminCategoryDesk';
import { AdminUploadConfigDesk } from './AdminUploadConfigDesk';

export function AdminSettingsDesk() {
  const [activeTab, setActiveTab] = useState<'platform' | 'coupons' | 'categories' | 'uploads'>('platform');

  return (
    <div className="space-y-5 pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] md:pb-12">
      <div className="flex rounded-2xl overflow-x-auto border border-slate-200 bg-white p-2 shadow-xs gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('platform')}
          className={`flex-1 min-w-[120px] min-h-[44px] py-2.5 px-3.5 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform ${
            activeTab === 'platform'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>Platform & Fees</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coupons')}
          className={`flex-1 min-w-[120px] min-h-[44px] py-2.5 px-3.5 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform ${
            activeTab === 'coupons'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4 shrink-0" />
          <span>Coupons & Promos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex-1 min-w-[120px] min-h-[44px] py-2.5 px-3.5 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 shrink-0" />
          <span>Categories</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('uploads')}
          className={`flex-1 min-w-[120px] min-h-[44px] py-2.5 px-3.5 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-transform ${
            activeTab === 'uploads'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Cloud className="w-4 h-4 shrink-0" />
          <span>Uploads</span>
        </button>
      </div>

      {activeTab === 'platform' ? (
        <AdminPlatformConfigDesk />
      ) : activeTab === 'coupons' ? (
        <AdminCouponsDesk />
      ) : activeTab === 'categories' ? (
        <AdminCategoryDesk />
      ) : (
        <AdminUploadConfigDesk />
      )}
    </div>
  );
}
