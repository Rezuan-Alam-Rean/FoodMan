// authentication facade hook wrapping query mutations, zustand stores, and query cache clearing
'use client';

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/store/auth-store';
import { useCartStore } from '@/lib/store/cart-store';
import { useZoneStore } from '@/lib/store/zone-store';
import {
  useMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useGuestAuthMutation,
  useSetPasswordMutation,
} from '@/hooks/queries/use-auth-queries';
import type { User, UserRole } from '@/types';

export function useAuth() {
  const queryClient = useQueryClient();
  const store = useAuthStore();
  const cartStore = useCartStore();
  const zoneStore = useZoneStore();

  const meQuery = useMeQuery(!!store.token);

  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const guestAuthMutation = useGuestAuthMutation();
  const setPasswordMutation = useSetPasswordMutation();

  const rawUser = meQuery.data || store.user;
  const user: User | null = useMemo(() => {
    if (!rawUser) return null;
    if (typeof rawUser === 'object' && 'user' in (rawUser as any) && (rawUser as any).user) {
      return (rawUser as any).user as User;
    }
    return rawUser as User;
  }, [rawUser]);

  const token = store.token;
  const role = user?.role;

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
    onSuccess?: (user?: User) => void,
    onError?: (err: Error) => void
  ) => {
    loginMutation.mutate(credentials, {
      onSuccess: (data) => {
        queryClient.clear();
        cartStore.clearCart();
        zoneStore.resetZone();
        store.setAuth(data.token, data.user);
        onSuccess?.(data.user);
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
    onSuccess?: (user?: User) => void,
    onError?: (err: Error) => void
  ) => {
    registerMutation.mutate(payload, {
      onSuccess: (data) => {
        queryClient.clear();
        cartStore.clearCart();
        zoneStore.resetZone();
        store.setAuth(data.token, data.user);
        onSuccess?.(data.user);
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
    queryClient.clear();
    store.setAuth(res.token, res.user);
    return res;
  };

  const logout = (onSuccess?: () => void) => {
    // clear all tanstack query cache entries
    queryClient.clear();
    queryClient.removeQueries();

    // reset all zustand stores
    store.clearAuth();
    cartStore.clearCart();
    zoneStore.resetZone();

    // remove all persistent storage keys from local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('foodman_auth_token');
      localStorage.removeItem('foodman_auth_storage');
      localStorage.removeItem('foodman_cart_storage');
      localStorage.removeItem('foodman_zone_storage');
    }

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
    setPassword: setPasswordMutation.mutate,
    logout,
    clearAuth: store.clearAuth,
    switchPersona,
    refetchUser: meQuery.refetch,

    loginAsync: loginMutation.mutateAsync,
    registerAsync: registerMutation.mutateAsync,
    guestAuthAsync: guestAuthMutation.mutateAsync,
    setPasswordAsync: setPasswordMutation.mutateAsync,

    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isGuestAuthenticating: guestAuthMutation.isPending,
    isSettingPassword: setPasswordMutation.isPending,
  };
}
