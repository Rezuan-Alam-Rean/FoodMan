// sign in page for partners and standard users with react hook form and zod
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { loginSchema, type LoginFormValues } from '@/lib/validations/auth';
import { UtensilsCrossed, ArrowRight, Lock, Phone, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone_number: '',
      password: '',
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    setError('');
    login(
      { phone_number: values.phone_number.trim(), password: values.password.trim() },
      () => {
        router.push('/');
      },
      (err) => {
        setError(err.message || 'invalid login credentials');
      }
    );
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-md space-y-5">
      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-sm shadow-rose-500/20">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Sign In
        </h1>
        <p className="text-xs text-slate-500">
          Access your orders, kitchen desk, or rider radar.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Mobile Number
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
            Password
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
          disabled={isLoggingIn}
          className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <span>{isLoggingIn ? 'Signing in...' : 'Sign In'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-2 border-t border-slate-100 text-center text-xs text-slate-500">
        New to FoodMan?{' '}
        <Link href="/auth/register" className="font-bold text-rose-600 hover:underline">
          Create an Account
        </Link>
      </div>
    </div>
  );
}
