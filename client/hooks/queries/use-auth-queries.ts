// authentication query and mutation hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { User } from '@/types';

export const AUTH_KEYS = {
  me: ['auth', 'me'] as const,
};

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: AUTH_KEYS.me,
    queryFn: async (): Promise<User> => {
      const data = await apiClient.get<any, any>('/auth/me');
      if (data && typeof data === 'object' && 'user' in data && data.user) {
        return data.user as User;
      }
      return data as User;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { phone_number: string; password?: string }) => {
      const data = await apiClient.post<any, { user: User; token: string }>('/auth/login', credentials);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      phone_number: string;
      email?: string;
      password?: string;
      role?: string;
    }) => {
      const data = await apiClient.post<any, { user: User; token: string }>('/auth/register', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
    },
  });
}

export function useGuestAuthMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      phone_number: string;
      zone_id?: string;
      subzone_id?: string;
      detailed_address?: string;
    }) => {
      const data = await apiClient.post<any, { user: User; token: string; address?: any }>(
        '/auth/guest-auth',
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
    },
  });
}

export function useSetPasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      new_password: string;
      current_password?: string;
    }) => {
      const data = await apiClient.post<any, { success: boolean; message: string }>(
        '/auth/set-password',
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
    },
  });
}
