// upload config query and mutation hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface UploadConfig {
  id: string;
  name: string;
  uploadUrl: string;
  load: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const UPLOAD_CONFIG_KEYS = {
  all: ['upload-configs'] as const,
  one: (id: string) => ['upload-configs', id] as const,
};

export function useUploadConfigsQuery(isActive?: boolean) {
  return useQuery({
    queryKey: [...UPLOAD_CONFIG_KEYS.all, { isActive }],
    queryFn: async (): Promise<UploadConfig[]> => {
      const data = await apiClient.get<any, UploadConfig[]>('/upload/configs', {
        params: isActive !== undefined ? { isActive } : undefined,
      });
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateUploadConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      uploadUrl: string;
      isActive?: boolean;
    }) => {
      const data = await apiClient.post<any, UploadConfig>('/upload/configs', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UPLOAD_CONFIG_KEYS.all });
    },
  });
}

export function useUpdateUploadConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<UploadConfig, 'name' | 'uploadUrl' | 'isActive'>>;
    }) => {
      const data = await apiClient.patch<any, UploadConfig>(`/upload/configs/${id}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UPLOAD_CONFIG_KEYS.all });
    },
  });
}

export function useDeleteUploadConfigMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/upload/configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UPLOAD_CONFIG_KEYS.all });
    },
  });
}

export function useResetUploadConfigLoadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const data = await apiClient.patch<any, UploadConfig>(`/upload/configs/${id}/reset-load`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UPLOAD_CONFIG_KEYS.all });
    },
  });
}

export function useUploadImageMutation() {
  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string; public_id: string }> => {
      const formData = new FormData();
      formData.append('image', file);
      const data = await apiClient.post<any, { url: string; public_id: string }>('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  });
}
