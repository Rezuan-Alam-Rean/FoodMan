// rider profile, zone radar, and operational status query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Rider, Order } from '@/types';

export const RIDER_KEYS = {
  me: ['riders', 'me'] as const,
  available: ['riders', 'available-orders'] as const,
};

export function useRiderProfileQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.me,
    queryFn: async (): Promise<{ rider: Rider; active_delivery?: Order | null }> => {
      const data = await apiClient.get<any, { rider: Rider; active_delivery?: Order | null }>(
        '/riders/me'
      );
      return data;
    },
    enabled,
    refetchInterval: 8000,
  });
}

// rider zone radar polling hook (polling every 5 seconds)
export function useRiderAvailableOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.available,
    queryFn: async (): Promise<Order[]> => {
      const data = await apiClient.get<any, Order[]>('/riders/orders/available');
      return data;
    },
    enabled,
    refetchInterval: 5000, // short polling interval
  });
}

export function useToggleRiderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (is_online: boolean) => {
      const data = await apiClient.put<any, Rider>('/riders/status', { is_online });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.me });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.available });
    },
  });
}

export function useUpdateRiderZonesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (zone_ids: string[]) => {
      const data = await apiClient.put<any, Rider>('/riders/zones', { zone_ids });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.me });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.available });
    },
  });
}
