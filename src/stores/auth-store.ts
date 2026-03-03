import type { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session?.user,
      isLoading: false,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  reset: () =>
    set({
      session: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    }),
}));
