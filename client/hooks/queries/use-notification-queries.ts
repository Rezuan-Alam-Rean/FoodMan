// notification query and mutation hooks using tanstack query
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedNotificationsResponse, NotificationItem } from '@/types';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (params?: Record<string, any>) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotificationsQuery(
  params?: { page?: number; limit?: number; priority?: string; is_read?: string | boolean },
  enabled = true
) {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const priority = params?.priority || '';
  const is_read = params?.is_read !== undefined ? String(params.is_read) : '';

  return useQuery({
    queryKey: NOTIFICATION_KEYS.list({ page, limit, priority, is_read }),
    queryFn: async (): Promise<PaginatedNotificationsResponse> => {
      const searchParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (priority) searchParams.set('priority', priority);
      if (is_read) searchParams.set('is_read', is_read);

      const data = await apiClient.get<unknown, PaginatedNotificationsResponse>(
        `/notifications?${searchParams.toString()}`
      );
      return data;
    },
    enabled,
    staleTime: 10000,
  });
}

export function useUnreadNotificationCountQuery(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: async (): Promise<number> => {
      const data = await apiClient.get<unknown, { unread_count: number }>(
        '/notifications/unread-count'
      );
      return data?.unread_count ?? 0;
    },
    enabled,
    staleTime: 15000,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<NotificationItem> => {
      const data = await apiClient.put<unknown, NotificationItem>(
        `/notifications/${notificationId}/read`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<{ updated_count: number }> => {
      const data = await apiClient.put<unknown, { updated_count: number }>(
        '/notifications/read-all'
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
