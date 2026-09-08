// system settings query and mutation hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { SystemSettings } from '@/types';

export const SETTING_QUERY_KEYS = {
  all: ['system-settings'] as const,
};

export function useSystemSettingsQuery() {
  return useQuery({
    queryKey: SETTING_QUERY_KEYS.all,
    queryFn: async (): Promise<SystemSettings> => {
      const data = await apiClient.get<any, SystemSettings>('/settings');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useUpdateSystemSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: Partial<Pick<
        SystemSettings,
        | 'platform_service_fee'
        | 'official_mfs_number'
        | 'official_mfs_provider'
        | 'official_mfs_instructions'
        | 'is_mfs_active'
      >>
    ) => {
      const data = await apiClient.put<any, SystemSettings>('/settings', payload);
      return data;
    },
    onSuccess: (updatedData) => {
      queryClient.setQueryData(SETTING_QUERY_KEYS.all, updatedData);
      queryClient.invalidateQueries({ queryKey: SETTING_QUERY_KEYS.all });
    },
  });
}
