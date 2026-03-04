/**
 * Sprint Design System — Theme Composition
 *
 * Combines colors, typography, and spacing into a single theme object.
 * Supports dark (primary) and light (latte) modes.
 */

import { darkColors, lightColors, type ThemeColors } from './colors';
import { layout, radius, shadows, spacing } from './spacing';
import { typography } from './typography';

export type ThemeMode = 'dark' | 'light';

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  shadows: typeof shadows;
}

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  radius,
  layout,
  shadows,
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  radius,
  layout,
  shadows,
};

export function getTheme(mode: ThemeMode): Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}
