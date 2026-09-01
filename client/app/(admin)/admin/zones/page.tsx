// admin delivery zones and logistics route
'use client';

import React from 'react';
import { AdminHeaderStats } from '@/components/admin/AdminHeaderStats';
import { AdminZonesDesk } from '@/components/admin/AdminZonesDesk';

export default function AdminZonesPage() {
  return (
    <div className="space-y-6">
      <AdminHeaderStats />
      <AdminZonesDesk />
    </div>
  );
}
