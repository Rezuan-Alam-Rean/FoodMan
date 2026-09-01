// admin platform orders oversight route
'use client';

import React from 'react';
import { AdminHeaderStats } from '@/components/admin/AdminHeaderStats';
import { AdminOrdersDesk } from '@/components/admin/AdminOrdersDesk';

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <AdminHeaderStats />
      <AdminOrdersDesk />
    </div>
  );
}
