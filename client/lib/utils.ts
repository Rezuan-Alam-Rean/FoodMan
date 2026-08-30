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
