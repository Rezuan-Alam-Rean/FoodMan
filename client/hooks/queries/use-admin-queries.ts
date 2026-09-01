// admin control tower query hooks using tanstack query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const ADMIN_KEYS = {
  deskCounts: ['admin', 'desk-counts'] as const,
  users: (params?: Record<string, any>) => ['admin', 'users', params] as const,
  customerDetails: (id: string, page = 1) => ['admin', 'customer', id, page] as const,
  riderDetails: (id: string, page = 1) => ['admin', 'rider', id, page] as const,
  restaurantDetails: (id: string, page = 1) => ['admin', 'restaurant', id, page] as const,
  pendingMfs: ['admin', 'pending-mfs'] as const,
  remittances: (status?: string) => ['admin', 'remittances', status] as const,
  allWallets: ['admin', 'wallets'] as const,
  payoutHistory: ['admin', 'payout-history'] as const,
};

export function useAdminDeskCountsQuery() {
  return useQuery({
    queryKey: ADMIN_KEYS.deskCounts,
    queryFn: () =>
      apiClient.get<any, {
        pending_mfs_verifications: number;
        pending_cod_remittances: number;
        active_orders_in_progress: number;
      }>('/admin/desk/counts'),
    refetchInterval: 10000,
    staleTime: 8000,
  });
}

export function useAdminUsersQuery(params?: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(params),
    queryFn: () =>
      apiClient.get<any, { users: any[]; pagination: any }>('/admin/users', {
        params,
      }),
    staleTime: 30000,
  });
}

export function useAdminCustomerDetailsQuery(customerId: string, page = 1) {
  return useQuery({
    queryKey: ADMIN_KEYS.customerDetails(customerId, page),
    queryFn: () =>
      apiClient.get<any, any>(`/admin/users/customers/${customerId}`, {
        params: { page },
      }),
    enabled: !!customerId,
    staleTime: 30000,
  });
}

export function useAdminRiderDetailsQuery(riderId: string, page = 1) {
  return useQuery({
    queryKey: ADMIN_KEYS.riderDetails(riderId, page),
    queryFn: () =>
      apiClient.get<any, any>(`/admin/users/riders/${riderId}`, {
        params: { page },
      }),
    enabled: !!riderId,
    staleTime: 30000,
  });
}

export function useAdminRestaurantDetailsQuery(restaurantUserId: string, page = 1) {
  return useQuery({
    queryKey: ADMIN_KEYS.restaurantDetails(restaurantUserId, page),
    queryFn: () =>
      apiClient.get<any, any>(`/admin/users/restaurants/${restaurantUserId}`, {
        params: { page },
      }),
    enabled: !!restaurantUserId,
    staleTime: 30000,
  });
}

export function useAdminUserDetailsQuery(userId: string, page = 1) {
  return useQuery({
    queryKey: ['admin', 'user', userId, page] as const,
    queryFn: () =>
      apiClient.get<any, any>(`/admin/users/${userId}`, {
        params: { page },
      }),
    enabled: !!userId,
    staleTime: 30000,
  });
}

export function usePendingMfsPaymentsQuery() {
  return useQuery({
    queryKey: ADMIN_KEYS.pendingMfs,
    queryFn: () => apiClient.get<any, any[]>('/admin/payments/pending'),
    staleTime: 15000,
  });
}

export function useVerifyMfsPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      status,
      notes,
    }: {
      paymentId: string;
      status: 'VERIFIED' | 'FAILED';
      notes?: string;
    }) => apiClient.put(`/admin/payments/${paymentId}/verify`, { status, notes }),
    onSuccess: () => {
      // invalidate pending mfs payments list
      queryClient.invalidateQueries({ queryKey: ['admin', 'pending-mfs'] });
      // invalidate admin desk live counter badges
      queryClient.invalidateQueries({ queryKey: ['admin', 'desk-counts'] });
      // invalidate user list and detail statistics
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer'] });
      // invalidate global order queries
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
    },
  });
}

export function useAdminRemittancesQuery(status?: string) {
  return useQuery({
    queryKey: ADMIN_KEYS.remittances(status),
    queryFn: () =>
      apiClient.get<any, any[]>('/remittances/admin/all', {
        params: status ? { status } : undefined,
      }),
    staleTime: 15000,
  });
}

export function useVerifyRemittanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      remittanceId,
      status,
      admin_notes,
    }: {
      remittanceId: string;
      status: 'APPROVED' | 'REJECTED';
      admin_notes?: string;
    }) =>
      apiClient.put(`/remittances/admin/${remittanceId}/verify`, { status, admin_notes }),
    onSuccess: () => {
      // invalidate all remittance lists across all filters
      queryClient.invalidateQueries({ queryKey: ['admin', 'remittances'] });
      queryClient.invalidateQueries({ queryKey: ['remittances'] });
      // invalidate admin desk live counter badges
      queryClient.invalidateQueries({ queryKey: ['admin', 'desk-counts'] });
      // invalidate partner wallets and balances
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      // invalidate user directory and rider details
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'rider'] });
      queryClient.invalidateQueries({ queryKey: ['rider'] });
    },
  });
}

export function useAllPartnerWalletsQuery() {
  return useQuery({
    queryKey: ADMIN_KEYS.allWallets,
    queryFn: () => apiClient.get<any, any[]>('/wallets/admin/all'),
    staleTime: 30000,
  });
}

export function usePayoutHistoryQuery() {
  return useQuery({
    queryKey: ADMIN_KEYS.payoutHistory,
    queryFn: () => apiClient.get<any, any[]>('/payouts/history'),
    staleTime: 30000,
  });
}

export function useDisbursePayoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      recipient_user_id: string;
      amount: number;
      payout_channel: string;
      reference_txn_id: string;
      notes?: string;
    }) => apiClient.post('/payouts/settle', payload),
    onSuccess: () => {
      // invalidate partner wallets and payout history
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-history'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      // invalidate user directory and specific partner deep-dive statistics
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'rider'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant'] });
      queryClient.invalidateQueries({ queryKey: ['rider'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    },
  });
}

export function useCreateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      phone_number: string;
      email?: string;
      password: string;
      role: 'CUSTOMER' | 'RIDER' | 'RESTAURANT_OWNER' | 'ADMIN';
      vehicle_type?: string;
      driving_license_no?: string;
      nid_number?: string;
      assigned_zones?: string[];
      cash_in_hand_limit?: number;
      restaurant_name?: string;
      zone_id?: string;
      restaurant_address?: string;
      commission_rate?: number;
      description?: string;
    }) => apiClient.post('/admin/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'desk-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
  });
}

export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: {
        name?: string;
        phone_number?: string;
        email?: string;
        password?: string;
        vehicle_type?: string;
        driving_license_no?: string;
        nid_number?: string;
        assigned_zones?: string[];
        cash_in_hand_limit?: number;
        is_online?: boolean;
        restaurant_name?: string;
        zone_id?: string;
        restaurant_address?: string;
        commission_rate?: number;
        description?: string;
        is_open?: boolean;
      };
    }) => apiClient.put(`/admin/users/${userId}`, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'rider', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'restaurant', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'wallets'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useAdminAllOrdersQuery(params?: {
  status?: string;
  search?: string;
  zone_id?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'orders', params] as const,
    queryFn: () =>
      apiClient.get<any, { orders: any[]; pagination: any }>('/admin/orders', {
        params,
      }),
    refetchInterval: 8000,
    staleTime: 6000,
  });
}

export function useAdminCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      apiClient.post<any, { order: any }>(`/admin/orders/${orderId}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ADMIN_KEYS.deskCounts });
    },
  });
}
