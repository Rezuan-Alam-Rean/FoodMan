// admin partner wallets and payout disbursement desk route
'use client';

import React from 'react';
import { AdminHeaderStats } from '@/components/admin/AdminHeaderStats';
import { AdminTreasuryDesk } from '@/components/admin/AdminTreasuryDesk';

export default function AdminTreasuryPage() {
  return (
    <div className="space-y-6">
      <AdminHeaderStats />
      <AdminTreasuryDesk />
    </div>
  );
}
