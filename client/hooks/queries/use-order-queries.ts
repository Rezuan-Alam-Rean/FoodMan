// order state machine and polling query hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ADDRESS_KEYS } from './use-address-queries';
import type { Order, Payment } from '@/types';

export interface PaginatedOrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const ORDER_KEYS = {
  status: (id: string) => ['orders', 'status', id] as const,
  customerList: () => ['orders', 'me'] as const,
  restaurantLive: (restaurantId: string) => ['orders', 'restaurant', restaurantId, 'live'] as const,
};

export function useCustomerOrdersQuery(page = 1, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['orders', 'me', page, limit] as const,
    queryFn: async (): Promise<PaginatedOrdersResponse> => {
      const data = await apiClient.get<any, any>(`/orders/me?page=${page}&limit=${limit}`);
      if (Array.isArray(data)) {
        return {
          orders: data,
          pagination: {
            total: data.length,
            page: 1,
            limit: data.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
      return data;
    },
    enabled,
    refetchInterval: 5000, // short polling interval for live updates
    refetchOnWindowFocus: true,
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const data = await apiClient.post<any, { order: Order; payment: Payment; auth?: any }>(
        '/orders',
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.status(data.order.id || data.order._id) });
      queryClient.invalidateQueries({ queryKey: ['orders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ADDRESS_KEYS.all });
    },
  });
}

// customer live order tracking short polling hook
export function useLiveOrderStatusQuery(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ORDER_KEYS.status(orderId),
    queryFn: async (): Promise<{ order: Order; payment: Payment }> => {
      const data = await apiClient.get<any, { order: Order; payment: Payment }>(
        `/orders/${orderId}/status`
      );
      return data;
    },
    enabled: !!orderId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.order?.status;
      // stop polling when delivered or cancelled
      if (status === 'DELIVERED' || status === 'CANCELLED') {
        return false;
      }
      return 5000; // poll every 5 seconds while active
    },
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const data = await apiClient.post<any, Order>(`/orders/${orderId}/cancel`, { reason });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.status(variables.orderId) });
    },
  });
}

// restaurant live kitchen desk short polling hook
export function useRestaurantLiveOrdersQuery(restaurantId: string, enabled = true) {
  return useQuery({
    queryKey: ORDER_KEYS.restaurantLive(restaurantId),
    queryFn: async (): Promise<Order[]> => {
      const data = await apiClient.get<any, Order[]>(
        `/orders/restaurant/${restaurantId}/live`
      );
      return data;
    },
    enabled: !!restaurantId && enabled,
    refetchInterval: 6000, // poll kitchen feed every 6 seconds
  });
}

export function useRestaurantAcceptAndCookMutation(restaurantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const data = await apiClient.post<any, Order>(`/orders/${orderId}/restaurant-accept`);
      return data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.status(orderId) });
      if (restaurantId) {
        queryClient.invalidateQueries({ queryKey: ORDER_KEYS.restaurantLive(restaurantId) });
      }
    },
  });
}

export function useRestaurantFoodReadyMutation(restaurantId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const data = await apiClient.post<any, Order>(`/orders/${orderId}/restaurant-ready`);
      return data;
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.status(orderId) });
      if (restaurantId) {
        queryClient.invalidateQueries({ queryKey: ORDER_KEYS.restaurantLive(restaurantId) });
      }
    },
  });
}

export function useRiderAcceptOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const data = await apiClient.post<any, Order>(`/orders/${orderId}/rider-accept`);
      return data;
    },
    onSuccess: (acceptedOrder, orderId) => {
      queryClient.setQueryData(['riders', 'me'], (prev: any) => {
        if (!prev) return prev;
        return { ...prev, active_delivery: acceptedOrder };
      });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.status(orderId) });
      queryClient.invalidateQueries({ queryKey: ['riders', 'available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['riders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRiderPickupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const data = await apiClient.post<any, Order>(`/orders/${orderId}/rider-pickup`);
      return data;
    },
    onSuccess: (updatedOrder, orderId) => {
      queryClient.setQueryData(['riders', 'me'], (prev: any) => {
        if (!prev) return prev;
        return { ...prev, active_delivery: updatedOrder };
      });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.status(orderId) });
      queryClient.invalidateQueries({ queryKey: ['riders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['riders', 'available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useRiderDeliverMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const data = await apiClient.post<any, { order: Order; payment: Payment }>(
        `/orders/${orderId}/rider-deliver`
      );
      return data;
    },
    onSuccess: (_, orderId) => {
      queryClient.setQueryData(['riders', 'me'], (prev: any) => {
        if (!prev) return prev;
        return { ...prev, active_delivery: null };
      });
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.status(orderId) });
      queryClient.invalidateQueries({ queryKey: ['riders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['riders', 'available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['wallets', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['remittances', 'my-history'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
