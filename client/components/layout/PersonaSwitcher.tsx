// instant persona switcher component for seamless testing
'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { User, Store, Bike, ShieldCheck } from 'lucide-react';

const personas: { role: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { role: 'CUSTOMER', label: 'Customer', icon: User },
  { role: 'RESTAURANT_OWNER', label: 'Vendor', icon: Store },
  { role: 'RIDER', label: 'Rider', icon: Bike },
  { role: 'ADMIN', label: 'Admin', icon: ShieldCheck },
];

export function PersonaSwitcher() {
  const { role, switchPersona } = useAuth();

  return (
    <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
      {personas.map((p) => {
        const Icon = p.icon;
        const isActive = role === p.role || (!role && p.role === 'CUSTOMER');
        return (
          <button
            key={p.role}
            onClick={() => switchPersona(p.role)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
              isActive
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
            title={`switch persona to ${p.label}`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}
