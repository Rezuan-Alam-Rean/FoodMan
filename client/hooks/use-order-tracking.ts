'use client';

import { useMemo, useEffect } from 'react';
import {
  useLiveOrderStatusQuery,
  useCancelOrderMutation,
  ORDER_KEYS,
} from '@/hooks/queries/use-order-queries';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateReviewMutation } from '@/hooks/queries/use-review-queries';
import { getPusherClient } from '@/lib/pusher';
import type { OrderStatus } from '@/types';

export const ORDER_STEP_PROGRESS: Record<OrderStatus, number> = {
  PENDING_PAYMENT: 0,
  LOOKING_FOR_RIDER: 1,
  RIDER_ACCEPTED: 2,
  PREPARING: 3,
  READY_FOR_PICKUP: 4,
  PICKED_UP: 5,
  DELIVERED: 6,
  CANCELLED: -1,
};

export function useOrderTracking(orderId: string) {
  const queryClient = useQueryClient();
  const statusQuery = useLiveOrderStatusQuery(orderId, !!orderId);
  const cancelMutation = useCancelOrderMutation();
  const reviewMutation = useCreateReviewMutation();

  // subscribe directly to order channel for zero-latency status transitions
  useEffect(() => {
    if (!orderId) return;
    const pusher = getPusherClient();
    if (!pusher) return;

    const channelName = `order-${orderId}`;
    const channel = pusher.subscribe(channelName);

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.status(orderId) });
    };

    channel.bind('order:created', handleUpdate);
    channel.bind('order:rider_assigned', handleUpdate);
    channel.bind('order:preparing', handleUpdate);
    channel.bind('order:food_ready', handleUpdate);
    channel.bind('order:picked_up', handleUpdate);
    channel.bind('order:delivered', handleUpdate);
    channel.bind('order:cancelled', handleUpdate);
    channel.bind('order:status_updated', handleUpdate);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [orderId, queryClient]);


  const order = statusQuery.data?.order;
  const payment = statusQuery.data?.payment;

  const currentStep = useMemo(() => {
    if (!order?.status) return 0;
    return ORDER_STEP_PROGRESS[order.status] ?? 0;
  }, [order?.status]);

  // customer cannot cancel once food preparation has started or dual acceptance is locked
  const isCancellationLocked = useMemo(() => {
    if (!order) return false;
    return (
      order.cancellation_locked ||
      currentStep >= ORDER_STEP_PROGRESS.PREPARING ||
      order.status === 'DELIVERED' ||
      order.status === 'CANCELLED'
    );
  }, [order, currentStep]);

  const isDelivered = order?.status === 'DELIVERED';
  const isCancelled = order?.status === 'CANCELLED';

  const cancelOrder = (reason?: string, onSuccess?: () => void, onError?: (err: Error) => void) => {
    cancelMutation.mutate(
      { orderId, reason },
      {
        onSuccess: () => onSuccess?.(),
        onError: (err) => onError?.(err as Error),
      }
    );
  };

  const submitReview = (
    payload: {
      food_rating?: number;
      food_review?: string;
      rider_rating?: number;
      rider_review?: string;
    },
    onSuccess?: () => void,
    onError?: (err: Error) => void
  ) => {
    reviewMutation.mutate(
      {
        order_id: orderId,
        ...payload,
      },
      {
        onSuccess: () => onSuccess?.(),
        onError: (err) => onError?.(err as Error),
      }
    );
  };

  return {
    order,
    payment,
    currentStep,
    isCancellationLocked,
    isDelivered,
    isCancelled,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    error: statusQuery.error,

    cancelOrder,
    submitReview,
    isCancelling: cancelMutation.isPending,
    isSubmittingReview: reviewMutation.isPending,
    refetchStatus: statusQuery.refetch,
  };
}
