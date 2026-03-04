/**
 * Sprint Design System — Color Tokens
 *
 * Brand aesthetic: Warm precision. Premium instrument feel.
 * Dark mode is primary. Light mode uses coffee/cream/latte tones.
 *
 * Accent color: Warm amber/caramel — like polished wood or aged leather.
 */

export const palette = {
  // Warm neutrals (stone family)
  stone50: '#FAFAF9',
  stone100: '#F5F0EB',
  stone200: '#E8E0D7',
  stone300: '#D6CCC2',
  stone400: '#A8A29E',
  stone500: '#78716C',
  stone600: '#57534E',
  stone700: '#44403C',
  stone800: '#292524',
  stone850: '#1C1917',
  stone900: '#171412',
  stone950: '#0C0A09',

  // Brand amber
  amber300: '#D4A574',
  amber400: '#C4956A',
  amber500: '#B07D4F',
  amber600: '#9A6B3E',
  amber700: '#7D5530',

  // Semantic
  green300: '#86EFAC',
  green500: '#22C55E',
  green900: '#14532D',
  red300: '#FCA5A5',
  red500: '#EF4444',
  red900: '#7F1D1D',
  yellow300: '#FCD34D',
  yellow500: '#F59E0B',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export interface ThemeColors {
  // Backgrounds
  bg: string;
  bgCard: string;
  bgElevated: string;
  bgInput: string;
  bgOverlay: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;

  // Primary (brand accent)
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  primarySubtle: string;

  // Secondary
  secondary: string;
  secondaryForeground: string;

  // Border
  border: string;
  borderMuted: string;
  borderFocus: string;

  // Semantic
  success: string;
  successBg: string;
  error: string;
  errorBg: string;
  warning: string;
  warningBg: string;

  // Interactive
  pressOverlay: string;
}

export const darkColors: ThemeColors = {
  // Backgrounds
  bg: palette.stone950,
  bgCard: palette.stone850,
  bgElevated: palette.stone800,
  bgInput: palette.stone850,
  bgOverlay: 'rgba(0, 0, 0, 0.6)',

  // Text
  text: palette.stone50,
  textSecondary: palette.stone400,
  textMuted: palette.stone500,
  textOnPrimary: palette.stone950,

  // Primary
  primary: palette.amber400,
  primaryHover: palette.amber300,
  primaryMuted: 'rgba(196, 149, 106, 0.15)',
  primarySubtle: 'rgba(196, 149, 106, 0.08)',

  // Secondary
  secondary: palette.stone800,
  secondaryForeground: palette.stone50,

  // Border
  border: palette.stone800,
  borderMuted: palette.stone850,
  borderFocus: palette.amber400,

  // Semantic
  success: palette.green300,
  successBg: 'rgba(134, 239, 172, 0.12)',
  error: palette.red300,
  errorBg: 'rgba(252, 165, 165, 0.12)',
  warning: palette.yellow300,
  warningBg: 'rgba(252, 211, 77, 0.12)',

  // Interactive
  pressOverlay: 'rgba(255, 255, 255, 0.06)',
};

export const lightColors: ThemeColors = {
  // Backgrounds
  bg: '#FAF7F2',
  bgCard: palette.white,
  bgElevated: '#F3EDE6',
  bgInput: palette.white,
  bgOverlay: 'rgba(0, 0, 0, 0.3)',

  // Text
  text: palette.stone850,
  textSecondary: palette.stone500,
  textMuted: palette.stone400,
  textOnPrimary: palette.stone50,

  // Primary
  primary: palette.amber500,
  primaryHover: palette.amber600,
  primaryMuted: 'rgba(176, 125, 79, 0.12)',
  primarySubtle: 'rgba(176, 125, 79, 0.06)',

  // Secondary
  secondary: '#F3EDE6',
  secondaryForeground: palette.stone850,

  // Border
  border: '#E8E0D7',
  borderMuted: '#F0EAE3',
  borderFocus: palette.amber500,

  // Semantic
  success: palette.green500,
  successBg: '#F0FDF4',
  error: palette.red500,
  errorBg: '#FEF2F2',
  warning: palette.yellow500,
  warningBg: '#FFFBEB',

  // Interactive
  pressOverlay: 'rgba(0, 0, 0, 0.04)',
};
