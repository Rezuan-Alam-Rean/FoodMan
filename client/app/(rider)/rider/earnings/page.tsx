// rider digital wallet, ledger statement, and fulfilled trips page on /rider/earnings
'use client';

import React from 'react';
import { RiderWalletCard } from '@/components/rider/RiderWalletCard';
import { RiderCompletedDeliveries } from '@/components/rider/RiderCompletedDeliveries';

export default function RiderEarningsPage() {
  return (
    <div className="space-y-5 pb-6">
      <RiderWalletCard />
      <RiderCompletedDeliveries />
    </div>
  );
}
