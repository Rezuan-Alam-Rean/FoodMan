// admin unified reconciliation desk route (mfs payments and cod cash remittances)
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminHeaderStats } from '@/components/admin/AdminHeaderStats';
import { AdminReconciliationDesk } from '@/components/admin/AdminReconciliationDesk';

function ReconciliationContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'cod' ? 'cod' : 'mfs';

  return <AdminReconciliationDesk initialTab={initialTab} />;
}

export default function AdminReconciliationPage() {
  return (
    <div className="space-y-6">
      <AdminHeaderStats />
      <Suspense fallback={<div className="py-12 text-center text-xs text-slate-400">Loading reconciliation desk...</div>}>
        <ReconciliationContent />
      </Suspense>
    </div>
  );
}
