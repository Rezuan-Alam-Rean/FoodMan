// user address query and mutation hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { UserAddress } from '@/types';

export const ADDRESS_KEYS = {
  all: ['addresses'] as const,
};

export function useAddressesQuery(enabled = true) {
  return useQuery({
    queryKey: ADDRESS_KEYS.all,
    queryFn: async (): Promise<UserAddress[]> => {
      const data = await apiClient.get<any, UserAddress[]>('/addresses');
      return data;
    },
    enabled,
    staleTime: 1000 * 10, // short stale window
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      zone_id: string;
      subzone_id: string;
      address_label?: string;
      detailed_address: string;
      contact_person_name?: string;
      contact_phone?: string;
      is_default?: boolean;
    }): Promise<UserAddress> => {
      const data = await apiClient.post<any, UserAddress>('/addresses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<{
        zone_id: string;
        subzone_id?: string | null;
        address_label?: string;
        detailed_address: string;
        contact_person_name?: string;
        contact_phone?: string;
        is_default?: boolean;
      }>;
    }): Promise<UserAddress> => {
      const data = await apiClient.put<any, UserAddress>(`/addresses/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
    },
  });
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete<any, null>(`/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
    },
  });
}
