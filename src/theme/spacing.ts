/**
 * Sprint Design System — Spacing & Layout Tokens
 *
 * Base unit: 4px
 * Consistent spacing creates visual rhythm.
 */

// Spacing scale (4px base)
export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Border radius
export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 22,
  full: 9999,
} as const;

// Screen padding
export const layout = {
  screenPaddingHorizontal: spacing[6],    // 24px
  screenPaddingTop: spacing[16],           // 64px (safe area + some)
  screenPaddingBottom: spacing[10],        // 40px
  cardPadding: spacing[5],                 // 20px
  sectionGap: spacing[8],                  // 32px
  itemGap: spacing[3],                     // 12px
  inputHeight: spacing[12],               // 48px
  buttonHeight: spacing[12],              // 48px
  buttonHeightLg: 52,
  iconSize: spacing[6],                    // 24px
  iconSizeSm: spacing[5],                 // 20px
  checkboxSize: 26,
  avatarSize: spacing[10],                // 40px
  avatarSizeLg: spacing[16],             // 64px
} as const;

// Common shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
