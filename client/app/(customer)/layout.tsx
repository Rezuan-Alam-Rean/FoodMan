// customer portal layout with mobile-first container and dribbble-styled navigation
import React from 'react';
import { CustomerHeader } from '@/components/customer/CustomerHeader';
import { CustomerBottomNav } from '@/components/customer/CustomerBottomNav';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900 pb-24 selection:bg-rose-100">
      <CustomerHeader />
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-2">{children}</main>
      <CustomerBottomNav />
    </div>
  );
}
