// authentication facade hook wrapping query mutations and zustand store
'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import {
  useMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useGuestAuthMutation,
} from '@/hooks/queries/use-auth-queries';
import type { User, UserRole } from '@/types';

export function useAuth() {
  const store = useAuthStore();
  const meQuery = useMeQuery(!!store.token);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const guestAuthMutation = useGuestAuthMutation();

  const rawUser = meQuery.data || store.user;
  const user: User | null = useMemo(() => {
    if (!rawUser) return null;
    if (typeof rawUser === 'object' && 'user' in (rawUser as any) && (rawUser as any).user) {
      return (rawUser as any).user as User;
    }
    return rawUser as User;
  }, [rawUser]);

  const token = store.token;
  const role = store.activePersona || user?.role;

  const isAdmin = role === 'ADMIN';
  const isRestaurantOwner = role === 'RESTAURANT_OWNER';
  const isRider = role === 'RIDER';
  const isCustomer = role === 'CUSTOMER';

  const hasRole = useMemo(() => {
    return (allowedRoles: UserRole | UserRole[]) => {
      if (!role) return false;
      if (Array.isArray(allowedRoles)) {
        return allowedRoles.includes(role);
      }
      return role === allowedRoles;
    };
  }, [role]);

  const isAuthenticated = !!token && !!user;
  const isLoading = !store.isInitialized || (!!token && !user && meQuery.isLoading);

  const login = (
    credentials: { phone_number: string; password?: string },
    onSuccess?: () => void,
    onError?: (err: Error) => void
  ) => {
    loginMutation.mutate(credentials, {
      onSuccess: (data) => {
        store.setAuth(data.token, data.user);
        onSuccess?.();
      },
      onError: (err) => onError?.(err as Error),
    });
  };

  const register = (
    payload: {
      name: string;
      phone_number: string;
      email?: string;
      password?: string;
      role?: string;
    },
    onSuccess?: () => void,
    onError?: (err: Error) => void
  ) => {
    registerMutation.mutate(payload, {
      onSuccess: (data) => {
        store.setAuth(data.token, data.user);
        onSuccess?.();
      },
      onError: (err) => onError?.(err as Error),
    });
  };

  const guestAuth = async (payload: {
    name?: string;
    phone_number: string;
    zone_id?: string;
    subzone_id?: string;
    detailed_address?: string;
  }) => {
    const res = await guestAuthMutation.mutateAsync(payload);
    store.setAuth(res.token, res.user);
    return res;
  };

  const logout = (onSuccess?: () => void) => {
    store.clearAuth();
    onSuccess?.();
  };

  const switchPersona = (newRole: UserRole) => {
    store.setActivePersona(newRole);
  };

  return {
    user,
    token,
    role,
    isAdmin,
    isRestaurantOwner,
    isRider,
    isCustomer,
    hasRole,
    isAuthenticated,
    isLoading,
    isInitialized: store.isInitialized,

    login,
    register,
    guestAuth,
    logout,
    clearAuth: store.clearAuth,
    switchPersona,
    refetchUser: meQuery.refetch,

    loginAsync: loginMutation.mutateAsync,
    registerAsync: registerMutation.mutateAsync,
    guestAuthAsync: guestAuthMutation.mutateAsync,

    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isGuestAuthenticating: guestAuthMutation.isPending,
  };
}
