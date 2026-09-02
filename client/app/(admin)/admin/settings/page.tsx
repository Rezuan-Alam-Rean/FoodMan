// admin platform settings route — menu categories and upload endpoints
'use client';

import React from 'react';
import { AdminHeaderStats } from '@/components/admin/AdminHeaderStats';
import { AdminSettingsDesk } from '@/components/admin/AdminSettingsDesk';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <AdminHeaderStats />
      <AdminSettingsDesk />
    </div>
  );
}
