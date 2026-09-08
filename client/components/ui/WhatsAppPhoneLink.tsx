// reusable WhatsApp phone link component for direct WhatsApp chat actions
'use client';

import React from 'react';
import { getWhatsAppUrl, formatPhone } from '@/lib/utils';

interface WhatsAppPhoneLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  phone: string | null | undefined;
  children?: React.ReactNode;
  showIcon?: boolean;
  iconClassName?: string;
  formatted?: boolean;
}

export function WhatsAppIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 20.15C10.57 20.15 9.12 19.75 7.85 19L7.55 18.82L4.43 19.64L5.26 16.59L5.07 16.28C4.24 14.97 3.81 13.46 3.81 11.91C3.81 7.37 7.5 3.69 12.05 3.69C14.25 3.69 16.32 4.55 17.87 6.1C19.42 7.66 20.28 9.72 20.27 11.92C20.27 16.46 16.59 20.15 12.05 20.15ZM16.57 14.34C16.32 14.21 15.11 13.62 14.88 13.54C14.66 13.45 14.49 13.41 14.33 13.66C14.16 13.9 13.69 14.46 13.55 14.62C13.4 14.79 13.26 14.81 13.01 14.68C12.76 14.56 11.96 14.3 11.01 13.45C10.27 12.79 9.77 11.97 9.62 11.72C9.48 11.47 9.61 11.34 9.73 11.21C9.84 11.1 9.98 10.92 10.11 10.77C10.23 10.63 10.28 10.52 10.36 10.36C10.44 10.19 10.4 10.05 10.34 9.92C10.28 9.79 9.78 8.57 9.58 8.06C9.38 7.57 9.17 7.63 9.02 7.63C8.87 7.62 8.71 7.62 8.54 7.62C8.37 7.62 8.11 7.68 7.88 7.93C7.65 8.18 7.02 8.77 7.02 9.97C7.02 11.17 7.89 12.33 8.02 12.5C8.14 12.66 9.74 15.13 12.2 16.19C12.78 16.44 13.24 16.59 13.59 16.71C14.18 16.89 14.71 16.87 15.14 16.8C15.62 16.73 16.61 16.2 16.82 15.62C17.02 15.04 17.02 14.54 16.96 14.44C16.9 14.34 16.82 14.47 16.57 14.34Z" />
    </svg>
  );
}

export function WhatsAppPhoneLink({
  phone,
  children,
  showIcon = true,
  iconClassName = 'w-3.5 h-3.5 text-emerald-600 shrink-0',
  formatted = false,
  className = '',
  onClick,
  ...rest
}: WhatsAppPhoneLinkProps) {
  if (!phone) return null;

  const waUrl = getWhatsAppUrl(phone);
  const displayText = children ?? (formatted ? formatPhone(phone) : phone);

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Chat with ${phone} on WhatsApp`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={`inline-flex items-center gap-1 text-inherit hover:text-emerald-600 transition cursor-pointer group/wa ${className}`}
      {...rest}
    >
      {showIcon && (
        <WhatsAppIcon className={`${iconClassName} group-hover/wa:scale-110 transition-transform`} />
      )}
      <span className="hover:underline underline-offset-2">{displayText}</span>
    </a>
  );
}
