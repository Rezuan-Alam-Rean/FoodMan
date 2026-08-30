// responsive top navigation header component
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useZoneStore } from '@/lib/store/zone-store';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import { PersonaSwitcher } from '@/components/layout/PersonaSwitcher';
import { formatBDT } from '@/lib/utils';
import {
  UtensilsCrossed,
  MapPin,
  ShoppingBag,
  User,
  Store,
  Bike,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, role, isAuthenticated, isAdmin, isRestaurantOwner, isRider } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { selectedZone, setSelectedZone } = useZoneStore();
  const { data: zones = [] } = useZonesQuery();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-rose-600 tracking-tight shrink-0">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-500/30">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <span className="hidden sm:inline text-slate-900 dark:text-white">
              Food<span className="text-rose-600">Man</span>
            </span>
          </Link>

                    <div className="relative flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <select
              value={selectedZone?.id || selectedZone?._id || ''}
              onChange={(e) => {
                const zone = zones.find((z) => (z.id || z._id) === e.target.value);
                if (zone) setSelectedZone(zone);
              }}
              className="bg-transparent font-medium focus:outline-hidden cursor-pointer max-w-[130px] sm:max-w-[180px] truncate pr-4 appearance-none"
            >
              <option value="" disabled>Select delivery zone</option>
              {zones.map((z) => (
                <option key={z.id || z._id} value={z.id || z._id} className="dark:bg-slate-900 text-slate-900 dark:text-white">
                  {z.name} (Fee: {formatBDT(z.fixed_delivery_fee)})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
          </div>
        </div>

                <div className="hidden md:flex items-center">
          <PersonaSwitcher />
        </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {isRestaurantOwner && (
            <Link
              href="/vendor"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                pathname.startsWith('/vendor')
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-rose-600" />
              <span>Kitchen Desk</span>
            </Link>
          )}

          {isRider && (
            <Link
              href="/rider"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                pathname.startsWith('/rider')
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Bike className="w-3.5 h-3.5 text-rose-600" />
              <span>Rider Radar</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                pathname.startsWith('/admin')
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
              <span>Control Tower</span>
            </Link>
          )}

                    <Link
            href="/cart"
            className="relative flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-900 dark:bg-rose-600 text-white font-bold text-xs shadow-xs hover:bg-slate-800 dark:hover:bg-rose-700 transition active:scale-95"
            title="View Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            )}
          </Link>

                    {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="hidden lg:inline max-w-[90px] truncate">{user.name}</span>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1 p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
