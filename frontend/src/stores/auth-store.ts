import { create } from 'zustand';
import { AuthContext, AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  context: AuthContext | null;
  isInitialized: boolean;
  setSession: (user: AuthUser, context: AuthContext) => void;
  updateContext: (context: Partial<AuthContext>) => void;
  clearSession: () => void;
  setInitialized: (value: boolean) => void;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasRole: (code: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  context: null,
  isInitialized: false,

  setSession: (user, context) => set({ user, context }),

  updateContext: (partial) =>
    set((state) => ({
      context: state.context ? { ...state.context, ...partial } : null,
    })),

  clearSession: () => set({ user: null, context: null }),

  setInitialized: (value) => set({ isInitialized: value }),

  hasPermission: (code) => {
    const { context } = get();
    if (!context) return false;
    if (context.roles.includes('SUPER_ADMIN')) return true;
    return context.permissions.includes(code);
  },

  hasAnyPermission: (codes) => {
    const { context } = get();
    if (!context) return false;
    if (context.roles.includes('SUPER_ADMIN')) return true;
    return codes.some((c) => context.permissions.includes(c));
  },

  hasRole: (code) => {
    const { context } = get();
    return context?.roles.includes(code) ?? false;
  },
}));
