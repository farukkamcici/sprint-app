/**
 * Themed Text Component
 *
 * Typography-aware text that automatically uses theme colors and font scale.
 */

import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import type { TypographyScale } from '../../theme/typography';

interface ThemedTextProps extends TextProps {
  /** Typography variant from the scale */
  variant?: TypographyScale;
  /** Override text color */
  color?: string;
  /** Use secondary text color */
  secondary?: boolean;
  /** Use muted text color */
  muted?: boolean;
  /** Center align */
  center?: boolean;
}

export function Text({
  variant = 'body',
  color,
  secondary,
  muted,
  center,
  style,
  ...props
}: ThemedTextProps) {
  const { theme } = useTheme();
  const typo = theme.typography[variant];

  const textColor = color
    ? color
    : muted
      ? theme.colors.textMuted
      : secondary
        ? theme.colors.textSecondary
        : theme.colors.text;

  const textStyle: TextStyle = {
    fontFamily: typo.fontFamily,
    fontSize: typo.fontSize,
    fontWeight: typo.fontWeight,
    letterSpacing: typo.letterSpacing,
    lineHeight: typo.lineHeight,
    color: textColor,
    ...(center && { textAlign: 'center' }),
  };

  return (
    <RNText style={[textStyle, style]} {...props} />
  );
}
