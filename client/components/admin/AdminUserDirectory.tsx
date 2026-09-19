// admin user directory with role tabs, search, open/closed status, and bulk status toggle
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
  Check,
  CheckCircle,
  XCircle,
  RefreshCw,
  Power,
} from 'lucide-react';
import { useAdminUsersQuery } from '@/hooks/queries/use-admin-queries';
import {
  useToggleRestaurantStatusMutation,
  useBulkToggleRestaurantStatusMutation,
} from '@/hooks/queries/use-restaurant-queries';
import { CreateUserModal } from './CreateUserModal';
import { WhatsAppPhoneLink } from '@/components/ui/WhatsAppPhoneLink';
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

  // selection state for restaurant tab
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState<Set<string>>(new Set());
  const [togglingRestaurantId, setTogglingRestaurantId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const toggleStatusMutation = useToggleRestaurantStatusMutation();
  const bulkToggleMutation = useBulkToggleRestaurantStatusMutation();

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSelectedRestaurantIds(new Set());
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => setDebouncedSearch(val), 350);
    setDebounceTimer(timer);
  };

  const handleTabChange = (tab: RoleTab) => {
    setActiveTab(tab);
    setSelectedRestaurantIds(new Set());
    setStatusMessage(null);
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

  // collect valid restaurant owners with profiles
  const restaurantUsers = users.filter(
    (u) => u.role === 'RESTAURANT_OWNER' && (u.restaurant_profile?._id || u.restaurant_profile?.id)
  );

  const eligibleRestaurantIds: string[] = restaurantUsers.map(
    (u) => (u.restaurant_profile._id || u.restaurant_profile.id) as string
  );

  const isAllSelected =
    eligibleRestaurantIds.length > 0 &&
    eligibleRestaurantIds.every((id) => selectedRestaurantIds.has(id));

  const isSomeSelected =
    selectedRestaurantIds.size > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRestaurantIds(new Set());
    } else {
      setSelectedRestaurantIds(new Set(eligibleRestaurantIds));
    }
  };

  const handleToggleSelect = (restaurantId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedRestaurantIds((prev) => {
      const next = new Set(prev);
      if (next.has(restaurantId)) {
        next.delete(restaurantId);
      } else {
        next.add(restaurantId);
      }
      return next;
    });
  };

  // bulk status toggle or set open/close
  const handleBulkStatusChange = async (actionType: 'toggle' | 'open' | 'close') => {
    if (selectedRestaurantIds.size === 0) return;

    setStatusMessage(null);
    const ids = Array.from(selectedRestaurantIds);

    const updates = ids.map((id) => {
      const matchingUser = restaurantUsers.find(
        (u) => (u.restaurant_profile?._id || u.restaurant_profile?.id) === id
      );
      const currentIsOpen = Boolean(matchingUser?.restaurant_profile?.is_open);
      const newIsOpen =
        actionType === 'open' ? true : actionType === 'close' ? false : !currentIsOpen;
      return {
        restaurantId: id,
        is_open: newIsOpen,
      };
    });

    try {
      await bulkToggleMutation.mutateAsync({
        updates,
        restaurantIds: ids,
        action: actionType,
        is_open: actionType === 'open' ? true : actionType === 'close' ? false : undefined,
      });

      setStatusMessage({
        text: `Successfully updated ${ids.length} restaurant${ids.length > 1 ? 's' : ''}`,
        type: 'success',
      });
      setSelectedRestaurantIds(new Set());
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to update restaurant status',
        type: 'error',
      });
    }
  };

  // single restaurant 1-click quick toggle
  const handleQuickToggle = async (restaurant: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const restaurantId = restaurant?._id || restaurant?.id;
    if (!restaurantId) return;

    setStatusMessage(null);
    setTogglingRestaurantId(restaurantId);
    try {
      await toggleStatusMutation.mutateAsync({
        restaurantId,
        is_open: !restaurant.is_open,
      });
      setStatusMessage({
        text: `"${restaurant.name}" is now ${!restaurant.is_open ? 'Open' : 'Closed'}`,
        type: 'success',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Failed to toggle restaurant status',
        type: 'error',
      });
    } finally {
      setTogglingRestaurantId(null);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-3">
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
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-11 sm:h-10 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-slate-900 text-base sm:text-xs font-bold placeholder:font-medium placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] transition-transform text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={`min-h-[44px] px-3.5 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 shrink-0 cursor-pointer active:scale-[0.98] transition-transform ${activeTab === tab.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 border animate-in fade-in duration-200 ${statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}


        {activeTab === 'RESTAURANT_OWNER' && eligibleRestaurantIds.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected;
                  }}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500/20 cursor-pointer accent-rose-600"
                />
                <span className="text-xs font-black text-slate-800">
                  {isAllSelected
                    ? `All ${eligibleRestaurantIds.length} Selected`
                    : selectedRestaurantIds.size > 0
                      ? `${selectedRestaurantIds.size} of ${eligibleRestaurantIds.length} Selected`
                      : `Select All (${eligibleRestaurantIds.length})`}
                </span>
              </label>
            </div>

            {selectedRestaurantIds.size > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={bulkToggleMutation.isPending}
                  onClick={() => handleBulkStatusChange('toggle')}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-60 shadow-xs"
                  title="Invert current open/closed status for all selected restaurants"
                >
                  {bulkToggleMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Toggle Status ({selectedRestaurantIds.size})</span>
                </button>

                <button
                  type="button"
                  disabled={bulkToggleMutation.isPending}
                  onClick={() => handleBulkStatusChange('open')}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-60"
                  title="Set all selected restaurants to Open"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Open Selected</span>
                </button>

                <button
                  type="button"
                  disabled={bulkToggleMutation.isPending}
                  onClick={() => handleBulkStatusChange('close')}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-60"
                  title="Set all selected restaurants to Closed"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Close Selected</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRestaurantIds(new Set())}
                  className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Select one, multiple, or all restaurants to toggle their open / close status
              </p>
            )}
          </div>
        )}

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
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform"
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
            {users.map((user: any) => {
              const restaurant = user.restaurant_profile;
              const restaurantId = restaurant?._id || restaurant?.id;
              const isSelected = Boolean(restaurantId && selectedRestaurantIds.has(restaurantId));
              const isTogglingThis = togglingRestaurantId === restaurantId;
              const isOpen = restaurant?.is_open !== false;

              return (
                <Link
                  key={user._id}
                  href={`/admin/users/${user._id}`}
                  className={`w-full rounded-3xl p-4 border transition flex items-center gap-3.5 text-left cursor-pointer group ${isSelected
                      ? 'border-rose-400 bg-rose-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                >

                  {activeTab === 'RESTAURANT_OWNER' && restaurantId && (
                    <div
                      onClick={(e) => handleToggleSelect(restaurantId, e)}
                      className="shrink-0 p-1 -m-1 cursor-pointer"
                      title={isSelected ? 'Deselect restaurant' : 'Select restaurant'}
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${isSelected
                            ? 'bg-rose-600 border-rose-600 text-white shadow-2xs'
                            : 'border-slate-300 bg-white hover:border-rose-400'
                          }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  )}

                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 to-slate-600 text-white flex items-center justify-center text-sm font-black shrink-0">
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900 leading-tight truncate group-hover:text-rose-600 transition">
                        {user.name}
                      </p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${ROLE_BADGE[user.role] || 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        {ROLE_LABEL[user.role] || user.role}
                      </span>


                      {user.role === 'RESTAURANT_OWNER' && restaurant && (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border transition ${isOpen
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                              : 'bg-rose-50 text-rose-700 border-rose-200/80'
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                              }`}
                          />
                          <span>{isOpen ? 'Open' : 'Closed'}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 font-medium truncate">
                      <WhatsAppPhoneLink phone={user.phone_number} />
                    </div>

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


                  {activeTab === 'RESTAURANT_OWNER' && restaurant && (
                    <button
                      type="button"
                      disabled={isTogglingThis}
                      onClick={(e) => handleQuickToggle(restaurant, e)}
                      title={isOpen ? 'Click to close store' : 'Click to open store'}
                      className={`shrink-0 min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border active:scale-95 cursor-pointer shadow-2xs ${isOpen
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        }`}
                    >
                      {isTogglingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {isOpen ? 'Close' : 'Open'}
                      </span>
                    </button>
                  )}

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition shrink-0" />
                </Link>
              );
            })}
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
