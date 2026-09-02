// admin cloudinary upload config management route
'use client';

import React from 'react';
import { AdminHeaderStats } from '@/components/admin/AdminHeaderStats';
import { AdminUploadConfigDesk } from '@/components/admin/AdminUploadConfigDesk';

export default function AdminUploadConfigsPage() {
  return (
    <div className="space-y-6">
      <AdminHeaderStats />
      <AdminUploadConfigDesk />
    </div>
  );
}
