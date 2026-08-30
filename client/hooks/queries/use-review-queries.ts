// customer review and rating query and mutation hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Review } from '@/types';

export const REVIEW_KEYS = {
  restaurant: (id: string) => ['reviews', 'restaurant', id] as const,
};

export function useRestaurantReviewsQuery(restaurantId: string) {
  return useQuery({
    queryKey: REVIEW_KEYS.restaurant(restaurantId),
    queryFn: async (): Promise<Review[]> => {
      const data = await apiClient.get<any, Review[]>(`/reviews/restaurants/${restaurantId}`);
      return data;
    },
    enabled: !!restaurantId,
  });
}

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      order_id: string;
      food_rating?: number | null;
      food_review?: string;
      rider_rating?: number | null;
      rider_review?: string;
    }) => {
      const data = await apiClient.post<any, Review>('/reviews', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: REVIEW_KEYS.restaurant(data.restaurant_id) });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
