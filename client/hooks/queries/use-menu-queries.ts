// menu category and food item query hooks using tanstack query
import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { RESTAURANT_KEYS } from './use-restaurant-queries';
import type { MenuCategory, FoodItem } from '@/types';

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
  list: (params?: { is_active?: boolean }) => ['categories', 'list', params] as const,
};

export function useInfiniteFoodItemsQuery(params?: {
  category_id?: string;
  search?: string;
  is_available?: boolean;
  is_open?: boolean;
}) {
  return useInfiniteQuery({
    queryKey: ['food-items', params],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await apiClient.get<any, {
        items: FoodItem[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>('/menu/items', {
        params: {
          is_available: true,
          is_open: true,
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

export function useCategoriesQuery(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: CATEGORY_KEYS.list(params),
    queryFn: async (): Promise<MenuCategory[]> => {
      const data = await apiClient.get<any, MenuCategory[]>('/menu/categories', {
        params,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; image_url?: string; sort_order?: number }) => {
      const data = await apiClient.post<any, MenuCategory>(
        '/menu/categories',
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      categoryId,
      updates,
    }: {
      categoryId: string;
      updates: Partial<MenuCategory>;
    }) => {
      const data = await apiClient.put<any, MenuCategory>(
        `/menu/categories/${categoryId}`,
        updates
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const data = await apiClient.delete(`/menu/categories/${categoryId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
    },
  });
}

export function useCreateFoodItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      category_id: string;
      name: string;
      description?: string;
      base_price: number;
      variants?: any[];
      add_ons?: any[];
      is_vegetarian?: boolean;
    }) => {
      const data = await apiClient.post<any, FoodItem>(
        `/menu/restaurants/${restaurantId}/items`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.detail(restaurantId) });
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.myRestaurant });
    },
  });
}

export function useUpdateFoodItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      foodItemId,
      updates,
    }: {
      foodItemId: string;
      updates: Partial<FoodItem>;
    }) => {
      const data = await apiClient.put<any, FoodItem>(
        `/menu/items/${foodItemId}`,
        updates
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.detail(restaurantId) });
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.myRestaurant });
    },
  });
}

export function useDeleteFoodItemMutation(restaurantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (foodItemId: string) => {
      const data = await apiClient.delete(`/menu/items/${foodItemId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.detail(restaurantId) });
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.myRestaurant });
    },
  });
}
