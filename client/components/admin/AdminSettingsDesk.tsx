// admin platform settings desk with tabs for menu categories and upload endpoints
'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, Cloud } from 'lucide-react';
import { AdminCategoryDesk } from './AdminCategoryDesk';
import { AdminUploadConfigDesk } from './AdminUploadConfigDesk';

export function AdminSettingsDesk() {
  const [activeTab, setActiveTab] = useState<'categories' | 'uploads'>('categories');

  return (
    <div className="space-y-5">
      <div className="flex rounded-2xl overflow-hidden border border-slate-200 bg-white p-1 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Menu Categories</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('uploads')}
          className={`flex-1 py-2.5 px-3 text-xs font-black rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'uploads'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Upload Endpoints</span>
        </button>
      </div>

      {activeTab === 'categories' ? (
        <AdminCategoryDesk />
      ) : (
        <AdminUploadConfigDesk />
      )}
    </div>
  );
}
