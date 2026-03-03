import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';
import { useEffect } from 'react';

/**
 * Initializes auth session listener.
 * Call once in the root layout.
 * Sets session in Zustand store on auth state changes.
 */
export function useAuthListener() {
  const setSession = useAuthStore((s) => s.setSession);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setLoading]);
}
