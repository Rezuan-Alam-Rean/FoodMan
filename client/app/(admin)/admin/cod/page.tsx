// redirect cod page to unified reconciliation desk
'use client';

import React from 'react';
import { AdminHeaderStats } from '@/components/admin/AdminHeaderStats';
import { AdminReconciliationDesk } from '@/components/admin/AdminReconciliationDesk';

export default function AdminCodPage() {
  return (
    <div className="space-y-6">
      <AdminHeaderStats />
      <AdminReconciliationDesk initialTab="cod" />
    </div>
  );
}
