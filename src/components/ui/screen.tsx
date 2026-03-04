/**
 * Screen Component
 *
 * Safe area wrapper with themed background.
 * Handles scroll and keyboard avoidance.
 */

import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Use ScrollView for scrollable content */
  scroll?: boolean;
  /** Handle keyboard */
  keyboard?: boolean;
  /** Custom padding */
  padding?: boolean;
  /** Custom style */
  style?: ViewStyle;
  /** Content container style (for scroll) */
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  keyboard = false,
  padding = true,
  style,
  contentStyle,
}: ScreenProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = theme.colors;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.bg,
  };

  const contentPadding: ViewStyle = padding
    ? {
        paddingHorizontal: theme.layout.screenPaddingHorizontal,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + theme.layout.screenPaddingBottom,
      }
    : {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      };

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[contentPadding, { flexGrow: 1 }, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentPadding, contentStyle]}>
      {children}
    </View>
  );

  const content = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  return (
    <View style={[containerStyle, style]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
