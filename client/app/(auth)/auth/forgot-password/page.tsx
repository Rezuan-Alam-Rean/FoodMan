// forgot password and verification code reset page
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from '@/lib/validations/auth';
import {
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from '@/hooks/queries/use-auth-queries';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const forgotMutation = useForgotPasswordMutation();
  const resetMutation = useResetPasswordMutation();

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Step 1 Form
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // Step 2 Form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    setValue: setResetValue,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
      code: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onSendCode = (values: ForgotPasswordFormValues) => {
    setErrorMessage('');
    setInfoMessage('');
    const cleanEmail = values.email.trim();

    forgotMutation.mutate(
      { email: cleanEmail },
      {
        onSuccess: (data) => {
          setSubmittedEmail(cleanEmail);
          setResetValue('email', cleanEmail);
          setInfoMessage(data.message || '6-digit reset code has been sent to your email.');
          setResendCooldown(60);
          setStep(2);
        },
        onError: (err: any) => {
          setErrorMessage(err.message || 'Failed to send password reset code. Please try again.');
        },
      }
    );
  };

  const onResendCode = () => {
    if (resendCooldown > 0 || !submittedEmail) return;
    setErrorMessage('');
    setInfoMessage('');

    forgotMutation.mutate(
      { email: submittedEmail },
      {
        onSuccess: (data) => {
          setInfoMessage(data.message || 'A fresh 6-digit reset code has been sent to your email.');
          setResendCooldown(60);
        },
        onError: (err: any) => {
          setErrorMessage(err.message || 'Failed to resend reset code.');
        },
      }
    );
  };

  const onResetPassword = (values: ResetPasswordFormValues) => {
    setErrorMessage('');
    setInfoMessage('');

    resetMutation.mutate(
      {
        email: values.email.trim(),
        code: values.code.trim(),
        new_password: values.new_password.trim(),
      },
      {
        onSuccess: () => {
          setStep(3);
        },
        onError: (err: any) => {
          setErrorMessage(err.message || 'Failed to reset password. Please verify your code.');
        },
      }
    );
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-md space-y-5 animate-in fade-in duration-200">

      <div className="text-center space-y-1.5">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          {step === 3 ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : (
            <KeyRound className="w-6 h-6 text-rose-600" />
          )}
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {step === 1 && 'Forgot Password'}
          {step === 2 && 'Verify Reset Code'}
          {step === 3 && 'Password Reset'}
        </h1>
        <p className="text-xs text-slate-500">
          {step === 1 && 'Enter your registered email address to receive a 6-digit reset code.'}
          {step === 2 && 'Check your inbox and enter the 6-digit code with your new password.'}
          {step === 3 && 'Your account password has been updated successfully.'}
        </p>
      </div>


      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}


      {infoMessage && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{infoMessage}</span>
        </div>
      )}


      {step === 1 && (
        <form onSubmit={handleEmailSubmit(onSendCode)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registered Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                {...registerEmail('email')}
                placeholder="your@email.com"
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden ${emailErrors.email ? 'border-rose-500' : 'border-slate-200'
                  }`}
              />
            </div>
            {emailErrors.email && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                {emailErrors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={forgotMutation.isPending}
            className="w-full min-h-[48px] py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
          >
            {forgotMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending code...</span>
              </>
            ) : (
              <>
                <span>Send Reset Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}


      {step === 2 && (
        <form onSubmit={handleResetSubmit(onResetPassword)} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Code sent to</span>
              <p className="text-xs font-black text-slate-800 truncate">{submittedEmail}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                setErrorMessage('');
                setInfoMessage('');
              }}
              className="text-xs font-bold text-rose-600 hover:underline shrink-0 cursor-pointer"
            >
              Change
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              6-Digit Reset Code *
            </label>
            <input
              type="text"
              maxLength={6}
              {...registerReset('code')}
              placeholder="123456"
              className={`w-full text-center tracking-[8px] font-mono text-xl sm:text-2xl font-black py-2.5 rounded-xl border bg-slate-50 text-slate-900 focus:bg-white focus:outline-hidden ${resetErrors.code ? 'border-rose-500' : 'border-slate-200'
                }`}
            />
            {resetErrors.code && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                {resetErrors.code.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                {...registerReset('new_password')}
                placeholder="At least 6 characters"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden ${resetErrors.new_password ? 'border-rose-500' : 'border-slate-200'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {resetErrors.new_password && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                {resetErrors.new_password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...registerReset('confirm_password')}
                placeholder="Re-type new password"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white text-xs sm:text-sm focus:outline-hidden ${resetErrors.confirm_password ? 'border-rose-500' : 'border-slate-200'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {resetErrors.confirm_password && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                {resetErrors.confirm_password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Didn't receive code?</span>
            {resendCooldown > 0 ? (
              <span className="text-slate-400 font-medium">
                Resend code in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                disabled={forgotMutation.isPending}
                onClick={onResendCode}
                className="font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${forgotMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Resend Code</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full min-h-[48px] py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
          >
            {resetMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Resetting password...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}


      {step === 3 && (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold leading-relaxed">
            Your password has been changed successfully. You can now use your new password to sign in.
          </div>

          <Link
            href="/auth/login"
            className="w-full min-h-[48px] py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
