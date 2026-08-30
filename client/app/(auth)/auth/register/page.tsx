// registration page for customers with 2-step onboarding (account creation + optional address setup)
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { useZonesQuery } from '@/hooks/queries/use-zone-queries';
import { useCreateAddressMutation } from '@/hooks/queries/use-address-queries';
import { registerSchema, type RegisterFormValues } from '@/lib/validations/auth';
import { formatBDT } from '@/lib/utils';
import {
  UtensilsCrossed,
  ArrowRight,
  Lock,
  Phone,
  User,
  AlertCircle,
  Mail,
  MapPin,
  Home,
  Briefcase,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, isRegistering } = useAuth();
  const { data: zones = [] } = useZonesQuery();
  const createAddressMutation = useCreateAddressMutation();

  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');

  // address step states
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedSubzoneId, setSelectedSubzoneId] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [addressLabel, setAddressLabel] = useState<'HOME' | 'WORK' | 'OTHER'>('HOME');
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phone_number: '',
      email: '',
      password: '',
      role: 'CUSTOMER',
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    setError('');
    registerAuth(
      {
        name: values.name.trim(),
        phone_number: values.phone_number.trim(),
        email: values.email?.trim() || undefined,
        password: values.password.trim(),
        role: 'CUSTOMER',
      },
      () => {
        // if zones exist, default to first zone and first subzone
        if (zones.length > 0) {
          const firstZ = zones[0];
          setSelectedZoneId(firstZ.id || firstZ._id);
          if (firstZ.subzones && firstZ.subzones.length > 0) {
            setSelectedSubzoneId(firstZ.subzones[0].id || firstZ.subzones[0]._id);
          }
        }
        setStep(2);
      },
      (err) => {
        setError(err.message || 'registration failed');
      }
    );
  };

  const handleSaveAddress = async () => {
    const activeZ = zones.find((z) => (z.id || z._id) === selectedZoneId) || zones[0];
    const effectiveZoneId = selectedZoneId || (activeZ ? String(activeZ.id || activeZ._id) : '');
    const subId = selectedSubzoneId || (activeZ?.subzones?.[0]?.id || activeZ?.subzones?.[0]?._id);

    if (!effectiveZoneId || !subId || !detailedAddress.trim()) {
      router.push('/');
      return;
    }

    setIsSavingAddress(true);
    setError('');

    try {
      await createAddressMutation.mutateAsync({
        zone_id: effectiveZoneId,
        subzone_id: subId,
        detailed_address: detailedAddress.trim(),
        address_label: addressLabel,
        is_default: true,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'failed to save address, you can add it anytime from your profile');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } finally {
      setIsSavingAddress(false);
    }
  };

  if (step === 2) {
    const activeZone = zones.find((z) => (z.id || z._id) === selectedZoneId) || zones[0];

    return (
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-md space-y-5">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
            <MapPin className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Set Delivery Address
          </h1>
          <p className="text-xs text-slate-500">
            Save your primary address for fast 1-click checkout in Dhaka.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Zone *
              </label>
              <div className="relative">
                <select
                  value={selectedZoneId || (zones[0]?.id || zones[0]?._id || '')}
                  onChange={(e) => {
                    const newZId = e.target.value;
                    setSelectedZoneId(newZId);
                    const z = zones.find((item) => (item.id || item._id) === newZId);
                    if (z && z.subzones && z.subzones.length > 0) {
                      setSelectedSubzoneId(z.subzones[0].id || z.subzones[0]._id);
                    } else {
                      setSelectedSubzoneId('');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden cursor-pointer appearance-none pr-8"
                >
                  {zones.map((z) => (
                    <option key={z.id || z._id} value={z.id || z._id}>
                      {z.name} (৳{z.fixed_delivery_fee})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subzone (Area) *
              </label>
              <div className="relative">
                <select
                  value={selectedSubzoneId || (activeZone?.subzones?.[0]?.id || activeZone?.subzones?.[0]?._id || '')}
                  onChange={(e) => setSelectedSubzoneId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden cursor-pointer appearance-none pr-8"
                >
                  {activeZone?.subzones?.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name} {s.custom_fixed_fee ? `(৳${s.custom_fixed_fee})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Street / Flat / House Address *
            </label>
            <textarea
              rows={2}
              value={detailedAddress}
              onChange={(e) => setDetailedAddress(e.target.value)}
              placeholder="e.g. Flat 4B, House 15, Road 7, Block D"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm focus:outline-hidden resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Address Label
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['HOME', 'WORK', 'OTHER'] as const).map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setAddressLabel(label)}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    addressLabel === label
                      ? 'border-rose-600 bg-rose-50 text-rose-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {label === 'HOME' && <Home className="w-3.5 h-3.5" />}
                  {label === 'WORK' && <Briefcase className="w-3.5 h-3.5" />}
                  {label === 'OTHER' && <Sparkles className="w-3.5 h-3.5" />}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveAddress}
            disabled={isSavingAddress || !detailedAddress.trim()}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
          >
            <span>{isSavingAddress ? 'Saving Address...' : 'Save & Start Ordering'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-md space-y-5">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-sm shadow-rose-500/20">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Create Account
        </h1>
        <p className="text-xs text-slate-500">
          Sign up to order food, save delivery addresses, and track orders.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Shakib Al Hasan"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden ${
                errors.name ? 'border-rose-500' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Mobile Number *
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="tel"
              {...register('phone_number')}
              placeholder="017XXXXXXXX"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden font-mono ${
                errors.phone_number ? 'border-rose-500' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.phone_number && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {errors.phone_number.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email (Optional)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              {...register('email')}
              placeholder="name@example.com"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden ${
                errors.email ? 'border-rose-500' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              {...register('password')}
              placeholder="••••••••"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden ${
                errors.password ? 'border-rose-500' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.password && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isRegistering}
          className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
        >
          <span>{isRegistering ? 'Creating Account...' : 'Continue'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-bold text-rose-600 hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

