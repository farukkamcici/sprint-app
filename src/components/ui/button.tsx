/**
 * Button Component
 *
 * Variants: primary, secondary, outline, ghost, destructive
 * Sizes: sm, md, lg
 * Supports loading state and haptic feedback.
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    type PressableProps,
    StyleSheet,
    type TextStyle,
    type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** Button text */
  label: string;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size */
  size?: ButtonSize;
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Icon rendered before label */
  icon?: React.ReactNode;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = true,
  disabled,
  style,
  icon,
  onPress,
  ...props
}: ButtonProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = (e: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.(e);
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle; loaderColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
            borderWidth: 0,
          },
          text: { color: colors.textOnPrimary },
          loaderColor: colors.textOnPrimary,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.secondary,
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: { color: colors.secondaryForeground },
          loaderColor: colors.secondaryForeground,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.border,
          },
          text: { color: colors.text },
          loaderColor: colors.text,
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 0,
          },
          text: { color: colors.textSecondary },
          loaderColor: colors.textSecondary,
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.error,
          },
          text: { color: colors.error },
          loaderColor: colors.error,
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { height: 36, paddingHorizontal: 16, borderRadius: theme.radius.sm },
          text: { fontSize: 13, fontWeight: '600' },
        };
      case 'md':
        return {
          container: { height: 48, paddingHorizontal: 20, borderRadius: theme.radius.md },
          text: { fontSize: 15, fontWeight: '600' },
        };
      case 'lg':
        return {
          container: { height: 52, paddingHorizontal: 24, borderRadius: theme.radius.md },
          text: { fontSize: 16, fontWeight: '600' },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        sizeStyles.container,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.loaderColor} size="small" />
      ) : (
        <>
          {icon}
          <Text
            variant="bodyMedium"
            style={[
              sizeStyles.text,
              variantStyles.text,
              icon ? { marginLeft: 8 } : undefined,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
