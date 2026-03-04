/**
 * Header Component
 *
 * Screen header with back navigation and optional title.
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

interface HeaderProps {
  /** Screen title */
  title?: string;
  /** Show back button */
  showBack?: boolean;
  /** Custom back action */
  onBack?: () => void;
  /** Right side action */
  rightAction?: React.ReactNode;
  /** Container style */
  style?: ViewStyle;
}

export function Header({
  title,
  showBack = true,
  onBack,
  rightAction,
  style,
}: HeaderProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: pressed ? colors.pressOverlay : 'transparent' },
            ]}
            hitSlop={8}
          >
            <Text variant="body" color={colors.textSecondary}>
              ←
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>

      {title ? (
        <Text variant="bodyMedium" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.titlePlaceholder} />
      )}

      <View style={styles.right}>
        {rightAction ?? <View style={styles.backPlaceholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    minHeight: 44,
  },
  left: {
    width: 44,
    alignItems: 'flex-start',
  },
  right: {
    width: 44,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  titlePlaceholder: {
    flex: 1,
  },
});
