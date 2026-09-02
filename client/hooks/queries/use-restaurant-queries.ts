// restaurant catalog and vendor management query hooks using tanstack query
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Restaurant, MenuCategory } from '@/types';

export const RESTAURANT_KEYS = {
  all: (params?: { search?: string; is_open?: boolean | string }) =>
    ['restaurants', params] as const,
  detail: (idOrSlug: string) => ['restaurant', idOrSlug] as const,
  myRestaurant: ['restaurant', 'me'] as const,
};

export function useInfiniteRestaurantsQuery(params?: {
  search?: string;
  is_open?: boolean | string;
}) {
  return useInfiniteQuery({
    queryKey: ['restaurants-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await apiClient.get<any, {
        restaurants: Restaurant[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>('/restaurants', {
        params: {
          ...params,
          page: pageParam,
          limit: 8,
        },
      });
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasNextPage) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useRestaurantsQuery(params?: {
  search?: string;
  is_open?: boolean | string;
}) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.all(params),
    queryFn: async (): Promise<Restaurant[]> => {
      const data = await apiClient.get<any, Restaurant[]>('/restaurants', {
        params,
      });
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useRestaurantDetailsQuery(idOrSlug: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.detail(idOrSlug),
    queryFn: async (): Promise<{ restaurant: Restaurant; menu: MenuCategory[] }> => {
      const data = await apiClient.get<any, { restaurant: Restaurant; menu: MenuCategory[] }>(
        `/restaurants/${idOrSlug}`
      );
      return data;
    },
    enabled: !!idOrSlug,
  });
}

export function useMyRestaurantQuery(enabled = true) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.myRestaurant,
    queryFn: async (): Promise<Restaurant> => {
      const data = await apiClient.get<any, Restaurant>('/restaurants/me/profile');
      return data;
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export function useToggleRestaurantStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      restaurantId,
      is_open,
    }: {
      restaurantId: string;
      is_open: boolean;
    }) => {
      const data = await apiClient.put<any, Restaurant>(
        `/restaurants/${restaurantId}/status`,
        { is_open }
      );
      return data;
    },
    onSuccess: (updatedRestaurant, variables) => {
      queryClient.setQueryData(RESTAURANT_KEYS.myRestaurant, updatedRestaurant);
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.myRestaurant });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCreateRestaurantMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const data = await apiClient.post<any, Restaurant>('/restaurants', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants-infinite'] });
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.myRestaurant });
    },
  });
}

export function useUpdateRestaurantProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      restaurantId,
      updates,
  }: {
      restaurantId: string;
      updates: {
        name?: string;
        address?: string;
        zone_id?: string;
        description?: string;
        logo_url?: string | null;
        cover_image_url?: string | null;
      };
    }) => {
      const data = await apiClient.put<any, Restaurant>(
        `/restaurants/${restaurantId}`,
        updates
      );
      return data;
    },
    onSuccess: (updatedRestaurant) => {
      queryClient.setQueryData(RESTAURANT_KEYS.myRestaurant, updatedRestaurant);
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.myRestaurant });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurants-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['food-items'] });
    },
  });
}

