/**
 * Input Component
 *
 * Themed text input with label and error state.
 */

import React, { useState } from 'react';
import {
    StyleSheet,
    TextInput,
    type TextInputProps,
    View,
    type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Label above input */
  label?: string;
  /** Error message */
  error?: string;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Input style override */
  inputStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text variant="label" style={styles.label} color={colors.textSecondary}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.bgInput,
            borderColor: error
              ? colors.error
              : isFocused
                ? colors.borderFocus
                : colors.border,
            color: colors.text,
            height: theme.layout.inputHeight,
            borderRadius: theme.radius.md,
            fontFamily: theme.typography.body.fontFamily,
            fontSize: theme.typography.body.fontSize,
          },
          inputStyle,
        ]}
        placeholderTextColor={colors.textMuted}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error ? (
        <Text variant="caption" color={colors.error} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  error: {
    marginTop: 4,
  },
});
