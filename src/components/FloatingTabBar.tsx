/**
 * FloatingTabBar
 *
 * Floating pill tab bar — flat pill, AI button rises above.
 * Left: Home  |  Center: AI (raised)  |  Right: Profile
 */

import { useTheme } from '@/theme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Home, Sparkles, User } from 'lucide-react-native';
import React, { useRef } from 'react';
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_META: Record<string, { label: string; Icon: React.FC<any> }> = {
  home:    { label: 'Home',    Icon: Home },
  ai:      { label: 'AI',      Icon: Sparkles },
  profile: { label: 'Profile', Icon: User },
};

const PILL_HEIGHT = 56;
const CENTER_BUTTON_SIZE = 52;
const CENTER_RISE = 14;

function TabItem({
  routeName,
  isActive,
  isCenter,
  onPress,
}: {
  routeName: string;
  isActive: boolean;
  isCenter: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const scale = useRef(new Animated.Value(1)).current;

  const meta = TAB_META[routeName] ?? { label: routeName, Icon: Home };

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, speed: 40 }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 10 }).start();

  /* ── Center AI button ──────────────────────────────── */
  if (isCenter) {
    return (
      <View style={styles.centerOuter}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          hitSlop={12}
        >
          <Animated.View
            style={[
              styles.centerButton,
              {
                backgroundColor: isActive ? `${colors.primary}18` : '#141210',
                borderColor: isActive ? colors.primary : `${colors.primary}35`,
                transform: [{ scale }],
              },
            ]}
          >
            <meta.Icon
              size={24}
              color={isActive ? colors.primary : `${colors.primary}88`}
              strokeWidth={1.5}
            />
          </Animated.View>
        </Pressable>
        <Text
          style={[
            styles.centerLabel,
            {
              color: isActive ? colors.primary : colors.textMuted,
              fontFamily: 'FunnelDisplay_500Medium',
            },
          ]}
        >
          {meta.label}
        </Text>
      </View>
    );
  }

  /* ── Side tabs ─────────────────────────────────────── */
  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.sideTab}
      hitSlop={8}
    >
      <Animated.View style={[styles.sideInner, { transform: [{ scale }] }]}>
        <meta.Icon
          size={20}
          color={isActive ? colors.primary : colors.textMuted}
          strokeWidth={isActive ? 1.8 : 1.4}
        />
        <Text
          style={[
            styles.sideLabel,
            {
              color: isActive ? colors.primary : colors.textMuted,
              fontFamily: isActive ? 'FunnelDisplay_600SemiBold' : 'FunnelDisplay_400Regular',
            },
          ]}
        >
          {meta.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 8) + 14;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: bottomOffset }]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: '#141210',
            borderColor: 'rgba(255,255,255,0.06)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.45,
            shadowRadius: 18,
            elevation: 18,
          },
        ]}
      >
        {state.routes
          .filter((r) => ['home', 'ai', 'profile'].includes(r.name))
          .map((route) => {
            const index = state.routes.indexOf(route);
            const isActive = state.index === index;
            const isCenter = route.name === 'ai';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                navigation.navigate(route.name as never);
              }
            };

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                isActive={isActive}
                isCenter={isCenter}
                onPress={onPress}
              />
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: CENTER_RISE,
    zIndex: 100,
    overflow: 'visible',
  },
  pill: {
    width: 280,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
    paddingHorizontal: 4,
  },
  // ── Center ─────────────────────────────────────────
  centerOuter: {
    flex: 1,
    alignItems: 'center',
    marginTop: -(CENTER_RISE + CENTER_BUTTON_SIZE / 2 - PILL_HEIGHT / 2) - 2,
    paddingBottom: 2,
    overflow: 'visible',
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  // ── Side tabs ───────────────────────────────────────
  sideTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: PILL_HEIGHT,
  },
  sideInner: {
    alignItems: 'center',
    gap: 3,
  },
  sideLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
