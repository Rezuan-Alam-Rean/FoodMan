'use client';

import React from 'react';
import { usePwa } from '@/hooks/use-pwa';
import { Download } from 'lucide-react';

interface PwaInstallButtonProps {
  className?: string;
}

export function PwaInstallButton({ className = '' }: PwaInstallButtonProps) {
  const { isMounted, isInstalled, promptInstall } = usePwa();

  if (!isMounted || isInstalled) return null;

  return (
    <button
      type="button"
      onClick={() => promptInstall()}
      className={`group relative flex items-center gap-1.5 h-10 sm:h-11 px-3 sm:px-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-xs focus:outline-hidden ${className}`}
      title="Install FoodMan App"
      aria-label="Install FoodMan App"
    >
      <span className="relative flex items-center justify-center shrink-0">
        <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 text-rose-600 dark:text-rose-400" />
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      </span>
      <span className="text-xs font-black tracking-tight">Install</span>
      <span className="hidden sm:inline text-xs font-black tracking-tight">App</span>
    </button>
  );
}
