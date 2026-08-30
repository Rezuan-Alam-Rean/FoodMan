// admin control tower and financial reconciliation facade hook
'use client';

import {
  useAdminDeskCountsQuery,
  usePendingMfsPaymentsQuery,
  useVerifyMfsPaymentMutation,
} from '@/hooks/queries/use-admin-desk-queries';
import {
  useAdminRemittancesQuery,
  useVerifyRemittanceMutation,
} from '@/hooks/queries/use-remittance-queries';
import {
  usePayoutHistoryQuery,
  useDisbursePayoutMutation,
} from '@/hooks/queries/use-payout-queries';
import { useAllWalletsQuery } from '@/hooks/queries/use-wallet-queries';
import {
  useZonesQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useCreateSubzoneMutation,
} from '@/hooks/queries/use-zone-queries';

export function useAdminTower() {
  const countsQuery = useAdminDeskCountsQuery();
  const pendingPaymentsQuery = usePendingMfsPaymentsQuery();
  const pendingRemittancesQuery = useAdminRemittancesQuery('PENDING_VERIFICATION');
  const payoutsQuery = usePayoutHistoryQuery();
  const walletsQuery = useAllWalletsQuery();
  const zonesQuery = useZonesQuery();

  const verifyPaymentMutation = useVerifyMfsPaymentMutation();
  const verifyRemittanceMutation = useVerifyRemittanceMutation();
  const disbursePayoutMutation = useDisbursePayoutMutation();

  const createZoneMutation = useCreateZoneMutation();
  const updateZoneMutation = useUpdateZoneMutation();
  const createSubzoneMutation = useCreateSubzoneMutation();

  const counts = countsQuery.data || {
    pending_mfs_verifications: 0,
    pending_cod_remittances: 0,
    active_orders_in_progress: 0,
  };

  const pendingPayments = pendingPaymentsQuery.data || [];
  const pendingRemittances = pendingRemittancesQuery.data || [];
  const payouts = payoutsQuery.data || [];
  const wallets = walletsQuery.data || [];
  const zones = zonesQuery.data || [];

  const verifyMfsPayment = (
    paymentId: string,
    status: 'VERIFIED' | 'FAILED',
    notes?: string,
    onSuccess?: () => void
  ) => {
    verifyPaymentMutation.mutate(
      { paymentId, status, notes },
      {
        onSuccess: () => onSuccess?.(),
      }
    );
  };

  const verifyRemittance = (
    remittanceId: string,
    status: 'APPROVED' | 'REJECTED',
    admin_notes?: string,
    onSuccess?: () => void
  ) => {
    verifyRemittanceMutation.mutate(
      { remittanceId, status, admin_notes },
      {
        onSuccess: () => onSuccess?.(),
      }
    );
  };

  const disbursePayout = (
    payload: {
      recipient_user_id: string;
      amount: number;
      payout_channel: string;
      reference_txn_id: string;
      notes?: string;
    },
    onSuccess?: () => void,
    onError?: (err: Error) => void
  ) => {
    disbursePayoutMutation.mutate(payload, {
      onSuccess: () => onSuccess?.(),
      onError: (err) => onError?.(err as Error),
    });
  };

  return {
    counts,
    pendingPayments,
    pendingRemittances,
    payouts,
    wallets,
    zones,

    isLoading:
      countsQuery.isLoading ||
      pendingPaymentsQuery.isLoading ||
      pendingRemittancesQuery.isLoading,

    verifyMfsPayment,
    verifyRemittance,
    disbursePayout,

    createZone: createZoneMutation.mutate,
    updateZone: updateZoneMutation.mutate,
    createSubzone: createSubzoneMutation.mutate,

    isVerifyingPayment: verifyPaymentMutation.isPending,
    isVerifyingRemittance: verifyRemittanceMutation.isPending,
    isDisbursingPayout: disbursePayoutMutation.isPending,
  };
}
