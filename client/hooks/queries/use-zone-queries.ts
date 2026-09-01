// zone and subzone query and mutation hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Zone, Subzone } from '@/types';

export const ZONE_KEYS = {
  all: ['zones'] as const,
};

export function useZonesQuery() {
  return useQuery({
    queryKey: ZONE_KEYS.all,
    queryFn: async (): Promise<Zone[]> => {
      const data = await apiClient.get<any, Zone[]>('/zones');
      return data;
    },
    staleTime: 1000 * 60 * 10, // cache window
  });
}

export function useCreateZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      city?: string;
      fixed_delivery_fee: number;
    }) => {
      const data = await apiClient.post<any, Zone>('/zones', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONE_KEYS.all });
    },
  });
}

export function useUpdateZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Zone>;
    }) => {
      const data = await apiClient.put<any, Zone>(`/zones/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONE_KEYS.all });
    },
  });
}

export function useCreateSubzoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      zoneId,
      payload,
    }: {
      zoneId: string;
      payload: { name: string; custom_fixed_fee?: number | null };
    }) => {
      const data = await apiClient.post<any, Subzone>(`/zones/${zoneId}/subzones`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONE_KEYS.all });
    },
  });
}

export function useUpdateSubzoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      subzoneId,
      updates,
    }: {
      subzoneId: string;
      updates: { name?: string; custom_fixed_fee?: number | null; is_active?: boolean };
    }) => {
      const data = await apiClient.put<any, Subzone>(`/zones/subzones/${subzoneId}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ZONE_KEYS.all });
    },
  });
}
