/**
 * Checkbox Component
 *
 * Binary toggle for daily checks. Premium feel with haptic feedback.
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Checkbox({ checked, onToggle, disabled, style }: CheckboxProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(
        checked
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium,
      ).catch(() => {});
    }
    onToggle();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.checkbox,
        {
          width: theme.layout.checkboxSize,
          height: theme.layout.checkboxSize,
          borderRadius: theme.radius.sm,
          borderColor: checked ? colors.primary : colors.border,
          backgroundColor: checked ? colors.primary : 'transparent',
        },
        pressed && { transform: [{ scale: 0.9 }] },
        disabled && { opacity: 0.5 },
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={6}
    >
      {checked ? (
        <Text
          variant="caption"
          color={colors.textOnPrimary}
          style={styles.check}
        >
          ✓
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    fontSize: 14,
    fontWeight: '700',
  },
});
