/**
 * Sprint Design System — Typography
 *
 * Font: Funnel Display — everywhere, all weights.
 */

import { Platform, TextStyle } from 'react-native';

// Font family mapping — all Funnel Display
export const fontFamily = {
  light:     'FunnelDisplay_300Light',
  regular:   'FunnelDisplay_400Regular',
  medium:    'FunnelDisplay_500Medium',
  semibold:  'FunnelDisplay_600SemiBold',
  bold:      'FunnelDisplay_700Bold',
  extrabold: 'FunnelDisplay_800ExtraBold',
  // aliases for backward compat
  displayLight:     'FunnelDisplay_300Light',
  displayRegular:   'FunnelDisplay_400Regular',
  displayMedium:    'FunnelDisplay_500Medium',
  displaySemibold:  'FunnelDisplay_600SemiBold',
  displayBold:      'FunnelDisplay_700Bold',
  displayExtraBold: 'FunnelDisplay_800ExtraBold',
} as const;

// Fallback for when fonts aren't loaded
export const systemFontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export interface TypographyVariant {
  fontSize: number;
  fontFamily: string;
  fontWeight: TextStyle['fontWeight'];
  letterSpacing: number;
  lineHeight: number;
}

// Typography scale — all Funnel Display
export const typography = {
  // Display — hero numbers, splash
  display: {
    fontSize: 34,
    fontFamily: fontFamily.extrabold,
    fontWeight: '800' as const,
    letterSpacing: -1.0,
    lineHeight: 40,
  },

  // H1 — screen titles
  h1: {
    fontSize: 28,
    fontFamily: fontFamily.bold,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 34,
  },

  // H2 — section headers
  h2: {
    fontSize: 22,
    fontFamily: fontFamily.semibold,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
    lineHeight: 28,
  },

  // H3 — card titles, subsections
  h3: {
    fontSize: 18,
    fontFamily: fontFamily.medium,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Body — default text
  body: {
    fontSize: 16,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Body Medium — emphasized body
  bodyMedium: {
    fontSize: 16,
    fontFamily: fontFamily.medium,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Body Semibold — strong body
  bodySemibold: {
    fontSize: 16,
    fontFamily: fontFamily.semibold,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 24,
  },

  // Small — secondary text
  small: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },

  // Small Medium — labels, metadata
  smallMedium: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },

  // Caption — timestamps, hints
  caption: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
    lineHeight: 16,
  },

  // Label — form labels, tags
  label: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },

  // Mono-style numbers
  number: {
    fontSize: 40,
    fontFamily: fontFamily.extrabold,
    fontWeight: '800' as const,
    letterSpacing: -1.5,
    lineHeight: 44,
  },
} as const;

export type TypographyScale = keyof typeof typography;


