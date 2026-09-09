// coupon and discount query hooks using tanstack react query
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  Coupon,
  DiscountType,
  ValidateCouponResponse,
  PaginatedCouponsResponse,
} from '@/types';

export const COUPON_KEYS = {
  all: (params?: Record<string, any>) => ['coupons', params] as const,
  detail: (id: string) => ['coupon', id] as const,
  restaurant: (restaurantId: string) => ['coupons', 'restaurant', restaurantId] as const,
};

export interface CreateCouponPayload {
  code: string;
  restaurant_id: string;
  title?: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  start_date?: string;
  expiry_date?: string | null;
  usage_limit?: number | null;
  usage_limit_per_user?: number | null;
  is_active?: boolean;
}

export interface UpdateCouponPayload extends Partial<CreateCouponPayload> {}

export interface ValidateCouponPayload {
  code: string;
  restaurant_id: string;
  customer_id?: string;
  food_subtotal: number;
}

/**
 * query coupons list for admin desk
 */
export function useAdminCouponsQuery(params?: {
  restaurant_id?: string;
  is_active?: boolean | string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: COUPON_KEYS.all(params),
    queryFn: async (): Promise<PaginatedCouponsResponse> => {
      const data = await apiClient.get<any, PaginatedCouponsResponse>('/coupons', {
        params,
      });
      return data;
    },
    staleTime: 1000 * 30,
  });
}

/**
 * query single coupon details
 */
export function useCouponDetailQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: COUPON_KEYS.detail(id),
    queryFn: async (): Promise<Coupon> => {
      const data = await apiClient.get<any, Coupon>(`/coupons/${id}`);
      return data;
    },
    enabled: Boolean(id) && enabled,
  });
}

/**
 * query active promotional coupons for a specific restaurant (customer view)
 */
export function useRestaurantCouponsQuery(restaurantId: string, enabled = true) {
  return useQuery({
    queryKey: COUPON_KEYS.restaurant(restaurantId),
    queryFn: async (): Promise<Coupon[]> => {
      if (!restaurantId) return [];
      const data = await apiClient.get<any, Coupon[]>(`/coupons/restaurant/${restaurantId}`);
      return data;
    },
    enabled: Boolean(restaurantId) && enabled,
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * mutation to validate coupon during checkout
 */
export function useValidateCouponMutation() {
  return useMutation({
    mutationFn: async (payload: ValidateCouponPayload): Promise<ValidateCouponResponse> => {
      const data = await apiClient.post<any, ValidateCouponResponse>('/coupons/validate', payload);
      return data;
    },
  });
}

/**
 * mutation to create a new coupon (admin)
 */
export function useCreateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCouponPayload): Promise<Coupon> => {
      const data = await apiClient.post<any, Coupon>('/coupons', payload);
      return data;
    },
    onSuccess: (newCoupon) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      if (newCoupon.restaurant_id) {
        const restId =
          typeof newCoupon.restaurant_id === 'string'
            ? newCoupon.restaurant_id
            : newCoupon.restaurant_id.id || newCoupon.restaurant_id._id;
        queryClient.invalidateQueries({ queryKey: COUPON_KEYS.restaurant(restId) });
      }
    },
  });
}

/**
 * mutation to update an existing coupon (admin)
 */
export function useUpdateCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCouponPayload;
    }): Promise<Coupon> => {
      const data = await apiClient.patch<any, Coupon>(`/coupons/${id}`, payload);
      return data;
    },
    onSuccess: (updatedCoupon) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: COUPON_KEYS.detail(updatedCoupon.id || updatedCoupon._id) });
      if (updatedCoupon.restaurant_id) {
        const restId =
          typeof updatedCoupon.restaurant_id === 'string'
            ? updatedCoupon.restaurant_id
            : updatedCoupon.restaurant_id.id || updatedCoupon.restaurant_id._id;
        queryClient.invalidateQueries({ queryKey: COUPON_KEYS.restaurant(restId) });
      }
    },
  });
}

/**
 * mutation to toggle coupon active/inactive status (admin)
 */
export function useToggleCouponStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<Coupon> => {
      const data = await apiClient.patch<any, Coupon>(`/coupons/${id}/toggle-status`, {});
      return data;
    },
    onSuccess: (toggledCoupon) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      queryClient.invalidateQueries({ queryKey: COUPON_KEYS.detail(toggledCoupon.id || toggledCoupon._id) });
      if (toggledCoupon.restaurant_id) {
        const restId =
          typeof toggledCoupon.restaurant_id === 'string'
            ? toggledCoupon.restaurant_id
            : toggledCoupon.restaurant_id.id || toggledCoupon.restaurant_id._id;
        queryClient.invalidateQueries({ queryKey: COUPON_KEYS.restaurant(restId) });
      }
    },
  });
}

/**
 * mutation to delete coupon (admin)
 */
export function useDeleteCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/coupons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
}
