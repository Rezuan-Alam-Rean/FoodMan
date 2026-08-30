// badge component for order statuses and labels
import React from 'react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

interface BadgeProps {
  status?: OrderStatus | string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children?: React.ReactNode;
  className?: string;
}

const statusLabels: Record<string, string> = {
  PENDING_PAYMENT: 'Pending Payment',
  LOOKING_FOR_RIDER: 'Matching Rider',
  RIDER_ACCEPTED: 'Rider Assigned',
  PREPARING: 'Kitchen Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  PICKED_UP: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const statusVariants: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber-50 text-amber-700 border-amber-200',
  LOOKING_FOR_RIDER: 'bg-blue-50 text-blue-700 border-blue-200',
  RIDER_ACCEPTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PREPARING: 'bg-orange-50 text-orange-700 border-orange-200',
  READY_FOR_PICKUP: 'bg-purple-50 text-purple-700 border-purple-200',
  PICKED_UP: 'bg-sky-50 text-sky-700 border-sky-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const colorVariants = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export function Badge({ status, variant, children, className }: BadgeProps) {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (status && statusVariants[status]) {
    style = statusVariants[status];
  } else if (variant && colorVariants[variant]) {
    style = colorVariants[variant];
  }

  const displayText = children || (status ? (statusLabels[status] || status.replace(/_/g, ' ')) : '');

  const showPulseDot = status === 'LOOKING_FOR_RIDER' || status === 'PREPARING' || status === 'PICKED_UP';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs',
        style,
        className
      )}
    >
      {showPulseDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
      )}
      <span>{displayText}</span>
    </span>
  );
}
