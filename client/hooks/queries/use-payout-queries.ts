// admin payout settlement query and mutation hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PayoutSettlement } from '@/types';

export const PAYOUT_KEYS = {
  history: ['payouts', 'history'] as const,
};

export function usePayoutHistoryQuery(enabled = true) {
  return useQuery({
    queryKey: PAYOUT_KEYS.history,
    queryFn: async (): Promise<PayoutSettlement[]> => {
      const data = await apiClient.get<any, PayoutSettlement[]>('/payouts/history');
      return data;
    },
    enabled,
  });
}

export function useDisbursePayoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      recipient_user_id: string;
      amount: number;
      payout_channel: string;
      reference_txn_id: string;
      notes?: string;
    }) => {
      const data = await apiClient.post<any, PayoutSettlement>('/payouts/settle', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYOUT_KEYS.history });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}
