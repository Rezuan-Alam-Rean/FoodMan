// rider status header with availability toggle and operational zones
'use client';

import React, { useState } from 'react';
import { useToggleRiderStatusMutation } from '@/hooks/queries/use-rider-queries';
import { RiderZoneModal } from './RiderZoneModal';
import type { Rider, Wallet } from '@/types';
import { formatBDT } from '@/lib/utils';
import {
  MapPin,
  Wallet as WalletIcon,
  Banknote,
  ChevronRight,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface RiderStatusHeaderProps {
  rider: Rider;
  wallet?: Wallet | null;
  activeDeliveryCount?: number;
}

export function RiderStatusHeader({
  rider,
  wallet,
  activeDeliveryCount = 0,
}: RiderStatusHeaderProps) {
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const toggleStatusMutation = useToggleRiderStatusMutation();

  const isOnline = rider.is_online;
  const assignedZones = Array.isArray(rider.assigned_zones) ? rider.assigned_zones : [];

  const handleToggle = () => {
    toggleStatusMutation.mutate(!isOnline);
  };

  const cashLiability =
    wallet?.current_balance !== undefined && wallet.current_balance < 0
      ? Math.abs(wallet.current_balance)
      : 0;

  const cashLimit = Number(rider.cash_in_hand_limit) || 3000;
  const isNearLimit = cashLiability >= cashLimit * 0.8;

  return (
    <>
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              <span className="text-sm font-black text-slate-900">
                {isOnline ? 'You are Online' : 'You are Offline'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {isOnline
                ? activeDeliveryCount > 0
                  ? '1 active delivery in progress'
                  : 'Radar scanning for orders'
                : 'Turn on toggle to receive orders'}
            </p>
          </div>

          <button
            type="button"
            disabled={toggleStatusMutation.isPending}
            onClick={handleToggle}
            className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
              isOnline ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-slate-300'
            }`}
            title={isOnline ? 'tap to go offline' : 'tap to go online'}
          >
            <span className="sr-only">Toggle online status</span>
            <span
              className={`pointer-events-none flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isOnline ? 'translate-x-8 text-emerald-600' : 'translate-x-0 text-slate-400'
              }`}
            >
              {toggleStatusMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className="text-[9px] font-black">{isOnline ? 'ON' : 'OFF'}</span>
              )}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 items-center flex-1 mr-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Zones:
            </span>
            {assignedZones.length === 0 ? (
              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> none assigned
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
            className="p-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
            title="configure operational delivery zones"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-[11px]">Edit</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <WalletIcon className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-bold uppercase">Earned</span>
            </div>
            <p className="text-sm font-black text-slate-900">
              {formatBDT(wallet?.lifetime_earnings || 0)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Banknote className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-bold uppercase">Cash in Hand</span>
            </div>
            <p
              className={`text-sm font-black ${
                isNearLimit ? 'text-rose-600 font-black' : 'text-slate-900'
              }`}
            >
              {formatBDT(cashLiability)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase">COD Limit</span>
            </div>
            <p className="text-sm font-black text-slate-900">{formatBDT(cashLimit)}</p>
          </div>
        </div>
      </div>

      <RiderZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        rider={rider}
      />
    </>
  );
}
