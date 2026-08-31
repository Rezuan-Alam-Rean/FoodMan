// rider cod remittance query and mutation hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { RiderRemittance } from '@/types';

export const REMITTANCE_KEYS = {
  myHistory: ['remittances', 'my-history'] as const,
  adminAll: (status?: string) => ['remittances', 'admin', status] as const,
};

export function useMyRemittancesQuery(enabled = true) {
  return useQuery({
    queryKey: REMITTANCE_KEYS.myHistory,
    queryFn: async (): Promise<RiderRemittance[]> => {
      const data = await apiClient.get<any, RiderRemittance[]>('/remittances/my-history');
      return data;
    },
    enabled,
  });
}

export function useAdminRemittancesQuery(status?: string, enabled = true) {
  return useQuery({
    queryKey: REMITTANCE_KEYS.adminAll(status),
    queryFn: async (): Promise<RiderRemittance[]> => {
      const data = await apiClient.get<any, RiderRemittance[]>('/remittances/admin/all', {
        params: { status },
      });
      return data;
    },
    enabled,
    refetchInterval: 8000,
  });
}

export function useSubmitRemittanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      amount: number;
      payment_method: string;
      sender_account_no: string;
      transaction_reference: string;
    }) => {
      const data = await apiClient.post<any, RiderRemittance>('/remittances/submit', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remittances'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['riders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
    },
  });
}

export function useVerifyRemittanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      remittanceId,
      status,
      admin_notes,
    }: {
      remittanceId: string;
      status: 'APPROVED' | 'REJECTED';
      admin_notes?: string;
    }) => {
      const data = await apiClient.put<any, RiderRemittance>(
        `/remittances/admin/${remittanceId}/verify`,
        { status, admin_notes }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remittances'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'counts'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}
