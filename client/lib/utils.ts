// utility functions for class names and formatting
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// format price in bangladesh taka
export function formatBDT(amount: number | string | null | undefined): string {
  const numeric = Number(amount) || 0;
  return `৳${numeric.toLocaleString('en-US')}`;
}

// format bangladesh mobile phone number display
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 7)} ${clean.slice(7)}`;
  }
  return phone;
}

// check if item or variant has an active discount
export function hasValidDiscount(regularPrice: number, discountPrice?: number | null): boolean {
  if (discountPrice === null || discountPrice === undefined || isNaN(Number(discountPrice))) {
    return false;
  }
  const discount = Number(discountPrice);
  return discount >= 0 && discount < regularPrice;
}

// returns effective price (discount price if active, otherwise regular price)
export function getEffectivePrice(regularPrice: number, discountPrice?: number | null): number {
  if (hasValidDiscount(regularPrice, discountPrice)) {
    return Number(discountPrice);
  }
  return regularPrice;
}

// generate WhatsApp chat direct URL with normalized international phone number
export function getWhatsAppUrl(phone: string | null | undefined, message?: string): string {
  if (!phone) return '#';
  const clean = phone.replace(/\D/g, '');
  if (!clean) return '#';
  let international = clean;
  if (clean.startsWith('01') && clean.length === 11) {
    international = `88${clean}`;
  } else if (clean.startsWith('1') && clean.length === 10) {
    international = `880${clean}`;
  }
  const baseUrl = `https://wa.me/${international}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

// calculate percentage discount between base price and discount price
export function calculateDiscountPercentage(basePrice: number, discountPrice?: number | null): number {
  if (!discountPrice || discountPrice >= basePrice || basePrice <= 0) return 0;
  return Math.round(((basePrice - discountPrice) / basePrice) * 100);
}

// format relative time (e.g. 'Just now', '5m ago', '2h ago', '3d ago')
export function formatRelativeTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  try {
    const now = Date.now();
    const d = new Date(dateStr);
    const timestamp = d.getTime();
    if (isNaN(timestamp)) return '';
    const diffSec = Math.floor((now - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    const days = Math.floor(diffSec / 86400);
    return `${days}d ago`;
  } catch {
    return '';
  }
}

// format order time (e.g. '12:35 PM' if today, or '05 Sep, 12:35 PM' if other day)
export function formatOrderTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isSameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isSameDay) {
      return timeStr;
    }

    const dateStrFormatted = d.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
    });
    return `${dateStrFormatted}, ${timeStr}`;
  } catch {
    return '';
  }
}

// format explicit order date and time (e.g. 'Today at 12:35 PM' or '05 Sep 2026, 12:35 PM')
export function formatOrderDateTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const isSameDay =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    if (isSameDay) {
      return `Today, ${timeStr}`;
    }

    const fullDate = d.toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
    return `${fullDate}, ${timeStr}`;
  } catch {
    return '';
  }
}

