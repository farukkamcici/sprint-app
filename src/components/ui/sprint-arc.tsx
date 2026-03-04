/**
 * SprintArc Component
 *
 * Circular progress ring built with pure React Native Views.
 * No SVG dependency — uses the two-half-circle rotation technique.
 * Animated on mount. Warm amber on dark stone.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Text } from './text';

interface SprintArcProps {
  /** Current day (1-indexed) */
  currentDay: number;
  /** Total days in sprint */
  totalDays: number;
  /** Size of the arc */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
}

export function SprintArc({
  currentDay,
  totalDays,
  size = 180,
  strokeWidth = 6,
}: SprintArcProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const progress = Math.min(currentDay / totalDays, 1);

  useEffect(() => {
    animatedProgress.setValue(0);
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const halfSize = size / 2;

  // Right half rotation: 0% → 0deg, 50% → 180deg
  const rightRotation = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Left half rotation: 0-50% → 0deg, 50-100% → 0-180deg
  const leftRotation = animatedProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
    extrapolate: 'clamp',
  });

  // Left half opacity: hidden until > 50%
  const leftOpacity = animatedProgress.interpolate({
    inputRange: [0, 0.499, 0.5, 1],
    outputRange: [0, 0, 1, 1],
    extrapolate: 'clamp',
  });

  const circleBase: ViewStyle = {
    width: size,
    height: size,
    borderRadius: halfSize,
    borderWidth: strokeWidth,
    borderColor: 'transparent',
    position: 'absolute',
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Track ring */}
      <View
        style={[
          circleBase,
          { borderColor: colors.border },
        ]}
      />

      {/* Right half clip */}
      <View style={[styles.halfClip, { width: halfSize, height: size, left: halfSize, overflow: 'hidden' }]}>
        <Animated.View
          style={[
            circleBase,
            {
              borderTopColor: colors.primary,
              borderRightColor: colors.primary,
              left: -halfSize,
              transform: [{ rotate: rightRotation }],
            },
          ]}
        />
      </View>

      {/* Left half clip — plain View to avoid Fabric clipping+animated conflict */}
      <View style={[styles.halfClip, { width: halfSize, height: size, left: 0, overflow: 'hidden' }]}>
        <Animated.View
          style={[
            circleBase,
            {
              borderBottomColor: colors.primary,
              borderLeftColor: colors.primary,
              left: halfSize,
              opacity: leftOpacity,
              transform: [{ rotate: leftRotation }],
            },
          ]}
        />
      </View>

      {/* Center content */}
      <View style={styles.centerContent}>
        <Text
          variant="display"
          style={[styles.dayNumber, { color: colors.text, fontSize: 44, lineHeight: 48 }]}
        >
          {currentDay}
        </Text>
        <Text variant="caption" color={colors.textMuted} style={styles.dayLabel}>
          of {totalDays}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfClip: {
    position: 'absolute',
    top: 0,
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  dayNumber: {
    marginBottom: -4,
  },
  dayLabel: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
