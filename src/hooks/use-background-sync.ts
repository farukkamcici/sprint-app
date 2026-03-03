import { syncAll } from '@/lib/sync-service';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

/**
 * Runs background sync when the app returns to foreground.
 * Should be mounted once in the root layout.
 */
export function useBackgroundSync() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        // App came to foreground — attempt sync
        syncAll().catch(() => {
          // Silent fail — data is safe in MMKV
        });
      }
      appState.current = nextState;
    });

    // Also sync on mount
    syncAll().catch(() => {});

    return () => {
      subscription.remove();
    };
  }, []);
}
