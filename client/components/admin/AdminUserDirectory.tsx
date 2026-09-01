// admin user directory with role tabs, search, and full-page detail navigation
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  User,
  Bike,
  Store,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useAdminUsersQuery } from '@/hooks/queries/use-admin-queries';
import { CreateUserModal } from './CreateUserModal';
import { formatBDT } from '@/lib/utils';

type RoleTab = 'ALL' | 'CUSTOMER' | 'RIDER' | 'RESTAURANT_OWNER';

const TABS: { value: RoleTab; label: string; icon: React.ReactNode }[] = [
  { value: 'ALL', label: 'All', icon: <Users className="w-3.5 h-3.5" /> },
  { value: 'CUSTOMER', label: 'Customers', icon: <User className="w-3.5 h-3.5" /> },
  { value: 'RIDER', label: 'Riders', icon: <Bike className="w-3.5 h-3.5" /> },
  { value: 'RESTAURANT_OWNER', label: 'Restaurants', icon: <Store className="w-3.5 h-3.5" /> },
];

const ROLE_BADGE: Record<string, string> = {
  CUSTOMER: 'bg-blue-100 text-blue-700',
  RIDER: 'bg-indigo-100 text-indigo-700',
  RESTAURANT_OWNER: 'bg-rose-100 text-rose-700',
  ADMIN: 'bg-slate-900 text-white',
};

const ROLE_LABEL: Record<string, string> = {
  CUSTOMER: 'Customer',
  RIDER: 'Rider',
  RESTAURANT_OWNER: 'Restaurant',
  ADMIN: 'Admin',
};

export function AdminUserDirectory() {
  const [activeTab, setActiveTab] = useState<RoleTab>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedSearch(val), 350);
    setDebounceTimer(timer);
  };

  const { data, isLoading, isError, refetch } = useAdminUsersQuery({
    role: activeTab === 'ALL' ? undefined : activeTab,
    search: debouncedSearch || undefined,
    limit: 30,
  });

  const users: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.users)
    ? data.users
    : [];

  const pagination = Array.isArray(data) ? null : data?.pagination;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">User Directory</h2>
              <p className="text-[11px] text-slate-400 font-medium">customers, riders, and restaurants</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="search name, phone, email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 text-rose-600 animate-spin" />
        </div>
      ) : isError ? (
        <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">failed to load user directory</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">no users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user: any) => (
            <Link
              key={user._id}
              href={`/admin/users/${user._id}`}
              className="w-full bg-white rounded-3xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-xs transition flex items-center gap-3.5 text-left cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-600 text-white flex items-center justify-center text-sm font-black shrink-0">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-black text-slate-900 leading-tight truncate group-hover:text-rose-600 transition">
                    {user.name}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${ROLE_BADGE[user.role] || 'bg-slate-100 text-slate-600'}`}>
                    {ROLE_LABEL[user.role] || user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium truncate">{user.phone_number}</p>

                {user.role === 'CUSTOMER' && user.customer_stats && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    {user.customer_stats.total_orders} orders • spent {formatBDT(user.customer_stats.total_spent)}
                  </p>
                )}
                {user.role === 'RIDER' && user.rider_stats && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    {user.rider_stats.completed_deliveries} deliveries • earned {formatBDT(user.rider_stats.total_earned)} • balance {formatBDT(user.rider_stats.current_balance)}
                  </p>
                )}
                {user.role === 'RESTAURANT_OWNER' && user.restaurant_stats && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    {user.restaurant_stats.fulfilled_orders} fulfilled • gross {formatBDT(user.restaurant_stats.gross_sales)} • balance {formatBDT(user.restaurant_stats.current_balance)}
                  </p>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition shrink-0" />
            </Link>
          ))}
        </div>
      )}

        {pagination && pagination.totalPages > 1 && (
          <p className="text-center text-[11px] text-slate-400 font-medium">
            showing {users.length} of {pagination.total} users
          </p>
        )}
      </div>

      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  );
}
