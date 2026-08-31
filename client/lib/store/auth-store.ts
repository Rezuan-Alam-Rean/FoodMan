// authentication state store using zustand
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  activePersona: UserRole | null;
  isInitialized: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  setActivePersona: (role: UserRole) => void;
  clearAuth: () => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activePersona: null,
      isInitialized: false,

      setAuth: (token: string, user: User) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('foodman_auth_token', token);
        }
        set({ token, user, activePersona: user.role, isInitialized: true });
      },

      setUser: (user: User) => {
        set({ user, activePersona: user.role });
      },

      setActivePersona: (role: UserRole) => {
        set({ activePersona: role });
      },

      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('foodman_auth_token');
          localStorage.removeItem('foodman_auth_storage');
        }
        set({ token: null, user: null, activePersona: null });
      },

      setInitialized: (val: boolean) => {
        set({ isInitialized: val });
      },
    }),
    {
      name: 'foodman_auth_storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        activePersona: state.activePersona,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setInitialized(true);
      },
    }
  )
);
