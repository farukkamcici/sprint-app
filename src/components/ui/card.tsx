/**
 * Card Component
 *
 * Elevated surface with themed styling.
 * Supports press interaction for navigation cards.
 */

import React from 'react';
import {
    Pressable,
    View,
    type StyleProp,
    type ViewProps,
    type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';

interface CardProps extends ViewProps {
  /** Use elevated background instead of card */
  elevated?: boolean;
  /** Make it pressable */
  onPress?: () => void;
  /** Custom padding */
  padding?: number;
  /** Custom style */
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  elevated = false,
  onPress,
  padding,
  style,
  ...props
}: CardProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const cardStyle: ViewStyle = {
    backgroundColor: elevated ? colors.bgElevated : colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: padding ?? theme.layout.cardPadding,
  };

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          pressed && {
            opacity: 0.92,
            transform: [{ scale: 0.985 }],
          },
          style,
        ]}
        onPress={onPress}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} {...props}>
      {children}
    </View>
  );
}
