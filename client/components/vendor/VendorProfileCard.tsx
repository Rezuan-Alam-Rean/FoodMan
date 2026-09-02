// restaurant outlet profile and account management settings card
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToggleRestaurantStatusMutation } from '@/hooks/queries/use-restaurant-queries';
import { SetPasswordModal } from '@/components/auth/SetPasswordModal';
import { EditRestaurantProfileModal } from './EditRestaurantProfileModal';
import type { Restaurant } from '@/types';
import {
  Store,
  MapPin,
  Percent,
  Lock,
  LogOut,
  Power,
  Loader2,
  User,
  Phone,
  Mail,
  AlertCircle,
  Edit3,
  Camera,
} from 'lucide-react';

interface VendorProfileCardProps {
  restaurant: Restaurant;
}

export function VendorProfileCard({ restaurant }: VendorProfileCardProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [error, setError] = useState('');

  const toggleStatusMutation = useToggleRestaurantStatusMutation();
  const isOpen = restaurant.is_open;
  const restaurantId = restaurant.id || restaurant._id;

  const handleToggleStoreStatus = () => {
    setError('');
    toggleStatusMutation.mutate(
      { restaurantId, is_open: !isOpen },
      {
        onError: (err: any) => {
          setError(err.message || 'failed to toggle restaurant store status');
        },
      }
    );
  };

  const zoneName =
    typeof restaurant.zone_id === 'object'
      ? (restaurant.zone_id as any)?.name || 'Default Zone'
      : 'Assigned Zone';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 leading-tight">Restaurant Profile</h2>
            <p className="text-[11px] text-slate-400 font-medium">Outlet information and store settings</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditProfileModalOpen(true)}
          className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5 text-rose-600" />
          <span>Edit Details</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        {restaurant.cover_image_url ? (
          <div className="relative h-32 sm:h-44 w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/80 group">
            <img
              src={restaurant.cover_image_url}
              alt={`${restaurant.name} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity" />
            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-800 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            >
              <Camera className="w-3.5 h-3.5 text-rose-600" />
              <span>Change Banner</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditProfileModalOpen(true)}
            className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/60 transition flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-rose-600 transition shadow-2xs">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">Add Outlet Cover Banner</span>
            <span className="text-[10px] text-slate-400">
              Upload a wide banner photo for your storefront
            </span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              onClick={() => setIsEditProfileModalOpen(true)}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-xl font-black shrink-0 shadow-sm cursor-pointer group"
              title="Click to update logo"
            >
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center text-xl font-black shadow-md shadow-rose-600/20">
                  {restaurant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                  {restaurant.name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate">Slug: {restaurant.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={toggleStatusMutation.isPending}
              onClick={handleToggleStoreStatus}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                isOpen
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              {toggleStatusMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>{isOpen ? 'Close Outlet' : 'Open Outlet for Orders'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
          <div
            onClick={() => setIsEditProfileModalOpen(true)}
            className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 flex items-center justify-between gap-3 cursor-pointer transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Address & Primary Zone
                </span>
                <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {restaurant.address}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{zoneName}</p>
              </div>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-600 transition shrink-0" />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Platform Commission
              </span>
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {restaurant.commission_rate ?? 10}% per order
              </p>
              <p className="text-[11px] text-slate-500">Configured by Admin Treasury</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-slate-600" />
          <h4 className="text-sm font-black text-slate-900">Partner Account Details</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Owner Name</span>
            <p className="font-bold text-slate-900">{user?.name || 'Restaurant Partner'}</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
            <p className="font-bold text-slate-900">{user?.phone_number || 'N/A'}</p>
          </div>

          {user?.email && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
              <p className="font-bold text-slate-900 truncate">{user.email}</p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Change Password</span>
          </button>

          <button
            type="button"
            onClick={() => logout(() => router.push('/auth/login'))}
            className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <EditRestaurantProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        restaurant={restaurant}
      />

      <SetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
