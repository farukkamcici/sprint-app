/**
 * Divider Component
 *
 * Horizontal separator with optional label.
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

interface DividerProps {
  /** Optional centered label */
  label?: string;
  /** Custom style */
  style?: ViewStyle;
}

export function Divider({ label, style }: DividerProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  if (label) {
    return (
      <View style={[styles.labelContainer, style]}>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
        <Text
          variant="caption"
          color={colors.textMuted}
          style={styles.label}
        >
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: colors.border }]} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.simpleLine,
        { backgroundColor: colors.border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    marginHorizontal: 16,
  },
  simpleLine: {
    height: 1,
    marginVertical: 16,
  },
});
