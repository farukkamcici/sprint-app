/**
 * Segmented Control Component
 *
 * Toggle between options (e.g., binary/numeric rule type).
 */

import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function SegmentedControl({
  options,
  selectedIndex,
  onSelect,
  disabled,
  style,
}: SegmentedControlProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const handleSelect = (index: number) => {
    if (index === selectedIndex) return;
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync().catch(() => {});
    }
    onSelect(index);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgElevated,
          borderRadius: theme.radius.md,
          borderWidth: 1,
          borderColor: colors.border,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        return (
          <Pressable
            key={option}
            style={[
              styles.option,
              {
                borderRadius: theme.radius.sm,
                backgroundColor: isSelected
                  ? colors.primary
                  : 'transparent',
              },
            ]}
            onPress={() => handleSelect(index)}
            disabled={disabled}
          >
            <Text
              variant="smallMedium"
              color={isSelected ? colors.textOnPrimary : colors.textSecondary}
            >
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
  },
  option: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
