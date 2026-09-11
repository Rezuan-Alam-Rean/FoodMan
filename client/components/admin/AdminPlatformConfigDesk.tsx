// admin platform configuration desk — configure platform fee, official MFS number, and checkout payment instructions
'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Banknote,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Info,
} from 'lucide-react';
import {
  useSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
} from '@/hooks/queries/use-setting-queries';
import { WhatsAppPhoneLink } from '@/components/ui/WhatsAppPhoneLink';

interface FormState {
  platform_service_fee: number;
  official_mfs_number: string;
  official_mfs_provider: string;
  official_mfs_instructions: string;
  is_mfs_active: boolean;
}

export function AdminPlatformConfigDesk() {
  const { data: settings, isLoading, isError, refetch } = useSystemSettingsQuery();
  const updateMutation = useUpdateSystemSettingsMutation();

  const [form, setForm] = useState<FormState>({
    platform_service_fee: 10,
    official_mfs_number: '01700-000000',
    official_mfs_provider: 'bKash / Nagad / MFS',
    official_mfs_instructions: 'Manual Send Money',
    is_mfs_active: true,
  });

  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // sync form with loaded settings
  useEffect(() => {
    if (settings) {
      setForm({
        platform_service_fee:
          typeof settings.platform_service_fee === 'number' ? settings.platform_service_fee : 10,
        official_mfs_number: settings.official_mfs_number || '01700-000000',
        official_mfs_provider: settings.official_mfs_provider || 'bKash / Nagad / MFS',
        official_mfs_instructions: settings.official_mfs_instructions || 'Manual Send Money',
        is_mfs_active: settings.is_mfs_active !== false,
      });
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaveSuccess(false);

    if (isNaN(form.platform_service_fee) || form.platform_service_fee < 0) {
      setFormError('Platform service fee must be a valid non-negative number.');
      return;
    }

    if (!form.official_mfs_number.trim()) {
      setFormError('Official MFS number cannot be empty.');
      return;
    }

    updateMutation.mutate(
      {
        platform_service_fee: Number(form.platform_service_fee),
        official_mfs_number: form.official_mfs_number.trim(),
        official_mfs_provider: form.official_mfs_provider.trim(),
        official_mfs_instructions: form.official_mfs_instructions.trim(),
        is_mfs_active: form.is_mfs_active,
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        },
        onError: (err: any) => {
          setFormError(err?.message || 'Failed to update platform settings');
        },
      }
    );
  };

  const handleResetToDefaults = () => {
    setForm({
      platform_service_fee: 10,
      official_mfs_number: '01700-000000',
      official_mfs_provider: 'bKash / Nagad / MFS',
      official_mfs_instructions: 'Manual Send Money',
      is_mfs_active: true,
    });
    setFormError('');
    setSaveSuccess(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
        <span className="text-xs text-slate-500 font-medium">Loading platform configuration...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-6 flex flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-bold text-slate-800">Failed to load platform settings</p>
        <button
          onClick={() => refetch()}
          className="min-h-[44px] px-5 py-2.5 bg-rose-600 text-white text-xs font-bold rounded-2xl shadow-xs hover:bg-rose-700 active:scale-[0.98] transition-transform transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black tracking-tight">Platform & Fee Configurations</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            Configure system-wide order service fees, official MFS receiver phone number, and manual payment checkout instructions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-transform text-slate-300 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Platform settings updated successfully! New orders and customer carts reflect these settings immediately.</span>
        </div>
      )}

      {formError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Platform Service Charge</h3>
              <p className="text-[11px] text-slate-400">Charged on every customer order in addition to food subtotal and delivery fee</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Service Fee Amount (৳) *
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.platform_service_fee}
                onChange={(e) => setForm({ ...form, platform_service_fee: parseFloat(e.target.value) || 0 })}
                className="w-full pl-8 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-base sm:text-sm font-bold text-slate-900 transition"
                placeholder="10"
                required
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Enter 0 if you wish to waive the platform service fee temporarily.</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">FoodMan Official MFS Account</h3>
                <p className="text-[11px] text-slate-400">bKash, Nagad, or Rocket account where customers send money</p>
              </div>
            </div>

            <label className="min-h-[44px] px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 cursor-pointer select-none transition">
              <input
                type="checkbox"
                checked={form.is_mfs_active}
                onChange={(e) => setForm({ ...form, is_mfs_active: e.target.checked })}
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">MFS Active</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Official MFS Phone Number *
              </label>
              <input
                type="text"
                value={form.official_mfs_number}
                onChange={(e) => setForm({ ...form, official_mfs_number: e.target.value })}
                className="w-full max-w-md px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-base sm:text-sm font-mono font-bold text-slate-900 transition"
                placeholder="01700-000000"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
                <span>WhatsApp Link Preview:</span>
                <WhatsAppPhoneLink phone={form.official_mfs_number} className="text-[11px] font-mono" />
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Provider Label
                </label>
                <input
                  type="text"
                  value={form.official_mfs_provider}
                  onChange={(e) => setForm({ ...form, official_mfs_provider: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-base sm:text-xs font-bold text-slate-900 transition"
                  placeholder="bKash / Nagad / MFS"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Instructions Subtext
                </label>
                <input
                  type="text"
                  value={form.official_mfs_instructions}
                  onChange={(e) => setForm({ ...form, official_mfs_instructions: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-base sm:text-xs font-bold text-slate-900 transition"
                  placeholder="Manual Send Money"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
