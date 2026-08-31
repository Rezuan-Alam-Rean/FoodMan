// customer portal layout with role protection for guests and customers
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { CustomerBottomNav } from '@/components/customer/CustomerBottomNav';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();

  const role = user?.role;
  const isNonCustomer = isAuthenticated && role && role !== 'CUSTOMER';

  useEffect(() => {
    if (!isInitialized) return;

    if (isNonCustomer) {
      if (role === 'RIDER') {
        router.replace('/rider');
      } else if (role === 'RESTAURANT_OWNER') {
        router.replace('/vendor');
      } else if (role === 'ADMIN') {
        router.replace('/admin');
      }
    }
  }, [isInitialized, isNonCustomer, role, router]);

  if (isNonCustomer) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900 pb-24 selection:bg-rose-100">
      <CustomerHeader />
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-2">{children}</main>
      <CustomerBottomNav />
    </div>
  );
}
