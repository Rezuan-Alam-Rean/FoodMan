// restaurant kitchen desk and menu management facade hook
'use client';

import { useMemo } from 'react';
import {
  useMyRestaurantQuery,
  useToggleRestaurantStatusMutation,
  useRestaurantDetailsQuery,
} from '@/hooks/queries/use-restaurant-queries';
import {
  useRestaurantLiveOrdersQuery,
  useRestaurantAcceptAndCookMutation,
  useRestaurantFoodReadyMutation,
} from '@/hooks/queries/use-order-queries';
import {
  useCategoriesQuery,
  useCreateFoodItemMutation,
  useUpdateFoodItemMutation,
  useDeleteFoodItemMutation,
} from '@/hooks/queries/use-menu-queries';
import { useMyWalletQuery } from '@/hooks/queries/use-wallet-queries';

export function useRestaurantDesk() {
  const restaurantQuery = useMyRestaurantQuery();
  const restaurant = restaurantQuery.data;
  const restaurantId = restaurant?.id || restaurant?._id || '';

  const liveOrdersQuery = useRestaurantLiveOrdersQuery(restaurantId, !!restaurantId);
  const menuDetailsQuery = useRestaurantDetailsQuery(restaurantId);
  const globalCategoriesQuery = useCategoriesQuery({ is_active: true });
  const walletQuery = useMyWalletQuery(!!restaurantId);

  const toggleStatusMutation = useToggleRestaurantStatusMutation();
  const acceptAndCookMutation = useRestaurantAcceptAndCookMutation(restaurantId);
  const foodReadyMutation = useRestaurantFoodReadyMutation(restaurantId);

  const createFoodItemMutation = useCreateFoodItemMutation(restaurantId);
  const updateFoodItemMutation = useUpdateFoodItemMutation(restaurantId);
  const deleteFoodItemMutation = useDeleteFoodItemMutation(restaurantId);

  const liveOrders = liveOrdersQuery.data || [];
  const menuCategories = menuDetailsQuery.data?.menu || [];
  const globalCategories = globalCategoriesQuery.data || [];
  const wallet = walletQuery.data?.wallet;
  const ledgerTransactions = walletQuery.data?.transactions || [];

  // group orders by kitchen stages
  const pendingRiderOrders = useMemo(
    () => liveOrders.filter((o) => o.status === 'LOOKING_FOR_RIDER'),
    [liveOrders]
  );
  const riderAcceptedOrders = useMemo(
    () => liveOrders.filter((o) => o.status === 'RIDER_ACCEPTED'),
    [liveOrders]
  );
  const preparingOrders = useMemo(
    () => liveOrders.filter((o) => o.status === 'PREPARING'),
    [liveOrders]
  );
  const readyOrders = useMemo(
    () => liveOrders.filter((o) => o.status === 'READY_FOR_PICKUP'),
    [liveOrders]
  );

  const toggleOpenStatus = (isOpen: boolean) => {
    if (!restaurantId) return;
    toggleStatusMutation.mutate({ restaurantId, is_open: isOpen });
  };

  const acceptAndStartCooking = (orderId: string, onSuccess?: () => void) => {
    acceptAndCookMutation.mutate(orderId, {
      onSuccess: () => onSuccess?.(),
    });
  };

  const markFoodReady = (orderId: string, onSuccess?: () => void) => {
    foodReadyMutation.mutate(orderId, {
      onSuccess: () => onSuccess?.(),
    });
  };

  return {
    restaurant,
    liveOrders,
    pendingRiderOrders,
    riderAcceptedOrders,
    preparingOrders,
    readyOrders,
    menuCategories,
    globalCategories,
    wallet,
    ledgerTransactions,

    isLoading: restaurantQuery.isLoading || liveOrdersQuery.isLoading,
    isMenuLoading: menuDetailsQuery.isLoading,

    toggleOpenStatus,
    acceptAndStartCooking,
    markFoodReady,

    createFoodItem: createFoodItemMutation.mutate,
    updateFoodItem: updateFoodItemMutation.mutate,
    deleteFoodItem: deleteFoodItemMutation.mutate,

    isAccepting: acceptAndCookMutation.isPending,
    isMarkingReady: foodReadyMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
  };
}
