/**
 * Badge Component
 *
 * Small status indicator with label.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'primary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const getVariantStyles = (): { bg: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: colors.successBg, text: colors.success };
      case 'error':
        return { bg: colors.errorBg, text: colors.error };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warning };
      case 'primary':
        return { bg: colors.primaryMuted, text: colors.primary };
      default:
        return { bg: colors.secondary, text: colors.textSecondary };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyles.bg,
          borderRadius: theme.radius.sm,
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        color={variantStyles.text}
        style={styles.text}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    textTransform: 'uppercase',
  },
});
