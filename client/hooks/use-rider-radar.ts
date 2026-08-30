// rider mobile radar and cash liability management facade hook
'use client';

import { useMemo } from 'react';
import {
  useRiderProfileQuery,
  useRiderAvailableOrdersQuery,
  useToggleRiderStatusMutation,
  useUpdateRiderZonesMutation,
} from '@/hooks/queries/use-rider-queries';
import {
  useRiderAcceptOrderMutation,
  useRiderPickupMutation,
  useRiderDeliverMutation,
} from '@/hooks/queries/use-order-queries';
import { useMyWalletQuery } from '@/hooks/queries/use-wallet-queries';
import {
  useMyRemittancesQuery,
  useSubmitRemittanceMutation,
} from '@/hooks/queries/use-remittance-queries';

export function useRiderRadar() {
  const profileQuery = useRiderProfileQuery();
  const rider = profileQuery.data?.rider;
  const activeDelivery = profileQuery.data?.active_delivery;
  const isOnline = !!rider?.is_online;

  const availableOrdersQuery = useRiderAvailableOrdersQuery(isOnline);
  const walletQuery = useMyWalletQuery(!!rider);
  const remittanceQuery = useMyRemittancesQuery(!!rider);

  const toggleStatusMutation = useToggleRiderStatusMutation();
  const updateZonesMutation = useUpdateRiderZonesMutation();

  const acceptOrderMutation = useRiderAcceptOrderMutation();
  const pickupMutation = useRiderPickupMutation();
  const deliverMutation = useRiderDeliverMutation();

  const submitRemittanceMutation = useSubmitRemittanceMutation();

  const availableOrders = availableOrdersQuery.data || [];
  const wallet = walletQuery.data?.wallet;
  const ledgerTransactions = walletQuery.data?.transactions || [];
  const remittances = remittanceQuery.data || [];

  // calculate current cash in hand liability (negative balance portion)
  const cashInHandLiability = useMemo(() => {
    if (!wallet) return 0;
    return wallet.current_balance < 0 ? Math.abs(wallet.current_balance) : 0;
  }, [wallet?.current_balance]);

  const cashLimit = rider?.cash_in_hand_limit || 3000;
  const isCashLimitExceeded = cashInHandLiability >= cashLimit;

  const toggleOnline = (online: boolean) => {
    toggleStatusMutation.mutate(online);
  };

  const updateAssignedZones = (zoneIds: string[]) => {
    updateZonesMutation.mutate(zoneIds);
  };

  const acceptOrder = (orderId: string, onSuccess?: () => void, onError?: (err: Error) => void) => {
    acceptOrderMutation.mutate(orderId, {
      onSuccess: () => onSuccess?.(),
      onError: (err) => onError?.(err as Error),
    });
  };

  const pickupOrder = (orderId: string, onSuccess?: () => void) => {
    pickupMutation.mutate(orderId, {
      onSuccess: () => onSuccess?.(),
    });
  };

  const deliverOrder = (orderId: string, onSuccess?: () => void) => {
    deliverMutation.mutate(orderId, {
      onSuccess: () => onSuccess?.(),
    });
  };

  const submitRemittance = (
    payload: {
      amount: number;
      payment_method: string;
      sender_account_no: string;
      transaction_reference: string;
    },
    onSuccess?: () => void,
    onError?: (err: Error) => void
  ) => {
    submitRemittanceMutation.mutate(payload, {
      onSuccess: () => onSuccess?.(),
      onError: (err) => onError?.(err as Error),
    });
  };

  return {
    rider,
    activeDelivery,
    isOnline,
    availableOrders,
    wallet,
    ledgerTransactions,
    remittances,
    cashInHandLiability,
    cashLimit,
    isCashLimitExceeded,

    isLoading: profileQuery.isLoading,
    isRadarLoading: availableOrdersQuery.isLoading,

    toggleOnline,
    updateAssignedZones,
    acceptOrder,
    pickupOrder,
    deliverOrder,
    submitRemittance,

    isAccepting: acceptOrderMutation.isPending,
    isPickingUp: pickupMutation.isPending,
    isDelivering: deliverMutation.isPending,
    isSubmittingRemittance: submitRemittanceMutation.isPending,
    isTogglingOnline: toggleStatusMutation.isPending,
  };
}
