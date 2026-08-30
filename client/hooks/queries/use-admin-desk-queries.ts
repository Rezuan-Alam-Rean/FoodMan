// admin control tower desk metrics and payment verification query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { AdminDeskCounts, Payment } from '@/types';

export const ADMIN_KEYS = {
  counts: ['admin', 'desk', 'counts'] as const,
  pendingPayments: ['admin', 'payments', 'pending'] as const,
};

// admin control tower aggregate badge counts polling hook (polling every 6 seconds)
export function useAdminDeskCountsQuery(enabled = true) {
  return useQuery({
    queryKey: ADMIN_KEYS.counts,
    queryFn: async (): Promise<AdminDeskCounts> => {
      const data = await apiClient.get<any, AdminDeskCounts>('/admin/desk/counts');
      return data;
    },
    enabled,
    refetchInterval: 6000,
  });
}

export function usePendingMfsPaymentsQuery(enabled = true) {
  return useQuery({
    queryKey: ADMIN_KEYS.pendingPayments,
    queryFn: async (): Promise<Payment[]> => {
      const data = await apiClient.get<any, Payment[]>('/admin/payments/pending');
      return data;
    },
    enabled,
    refetchInterval: 8000,
  });
}

export function useVerifyMfsPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      paymentId,
      status,
      notes,
    }: {
      paymentId: string;
      status: 'VERIFIED' | 'FAILED';
      notes?: string;
    }) => {
      const data = await apiClient.put<any, { payment: Payment; order: any }>(
        `/admin/payments/${paymentId}/verify`,
        { status, notes }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.counts });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.pendingPayments });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
