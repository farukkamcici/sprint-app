/**
 * Avatar Component
 *
 * Initials-based avatar with themed styling.
 */

import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

interface AvatarProps {
  /** Full name or email to extract initials */
  name?: string | null;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Press handler */
  onPress?: () => void;
  /** Custom style */
  style?: ViewStyle;
}

function getInitials(name?: string | null): string {
  if (!name) return '?';

  // If email, use first letter
  if (name.includes('@')) {
    return name[0].toUpperCase();
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 'md', onPress, style }: AvatarProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const sizeMap = {
    sm: { container: 32, text: 12 },
    md: { container: 40, text: 14 },
    lg: { container: 64, text: 22 },
  };

  const s = sizeMap[size];
  const initials = getInitials(name);

  const avatarStyle: ViewStyle = {
    width: s.container,
    height: s.container,
    borderRadius: s.container / 2,
    backgroundColor: colors.primaryMuted,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const content = (
    <Text
      variant="label"
      color={colors.primary}
      style={{ fontSize: s.text }}
    >
      {initials}
    </Text>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          avatarStyle,
          pressed && { opacity: 0.8 },
          style,
        ]}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[avatarStyle, style]}>
      {content}
    </View>
  );
}
