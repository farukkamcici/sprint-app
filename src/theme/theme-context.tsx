/**
 * Sprint Design System — Theme Context
 *
 * Provides theme data throughout the app.
 * Dark mode is the default. Preference is persisted to MMKV.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { storage } from '../lib/storage';
import type { ThemeColors } from './colors';
import type { Theme, ThemeMode } from './theme';
import { getTheme } from './theme';

const THEME_STORAGE_KEY = 'app.theme_mode';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getStoredTheme(): ThemeMode | null {
  try {
    const stored = storage.getString(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return null;
  } catch {
    return null;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = getStoredTheme();
    if (stored) return stored;
    // Default to dark (primary theme)
    return 'dark';
  });

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      storage.set(THEME_STORAGE_KEY, newMode);
    } catch {
      // Storage write failed, theme still applied in memory
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme: getTheme(mode),
    mode,
    isDark: mode === 'dark',
    toggleTheme,
    setMode,
  }), [mode, toggleTheme, setMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access the full theme object
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Hook to access just the color palette (most common usage)
 */
export function useThemeColors(): ThemeColors {
  const { theme } = useTheme();
  return theme.colors;
}
