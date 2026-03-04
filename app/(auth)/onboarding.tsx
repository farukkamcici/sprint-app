/**
 * Onboarding Screen
 *
 * 3 swipeable slides. Auth buttons inline on slide 3 bottom.
 * No separate login screen.
 *
 *   01 — Brand hook
 *   02 — The mechanic
 *   03 — The philosophy + Sign in
 */

import { Text } from '@/components/ui';
import { signInWithGoogle } from '@/lib/auth';
import { useTheme } from '@/theme';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Pressable,
    StyleSheet,
    View,
    type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  number: string;
  headline: string;
  accent: string;
  footnote: string;
}

const slides: Slide[] = [
  {
    number: '01',
    headline: 'Sprint.',
    accent: 'Execute,\ndon\'t negotiate.',
    footnote: 'A personal execution system\nfor people who finish things.',
  },
  {
    number: '02',
    headline: '3 rules.',
    accent: 'Lock in.\nDo the work.',
    footnote: 'Set your commitments.\nNo changes after Day 1.',
  },
  {
    number: '03',
    headline: 'Just truth.',
    accent: 'Did you do it,\nor didn\'t you?',
    footnote: 'No badges. No graphs.\nJust a clear record.',
  },
];

const LAST_INDEX = slides.length - 1;

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  // useNativeDriver: true — only opacity + transform are used from this value
  const scrollX = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    setLoading(false);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const isLastSlide = activeIndex === LAST_INDEX;

  const renderItem = ({ item, index }: { item: Slide; index: number }) => {
    const inputRange = [
      (index - 0.5) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 0.5) * SCREEN_WIDTH,
    ];
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [30, 0, 30],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
        <Animated.View style={[styles.slideContent, { opacity, transform: [{ translateY }] }]}>
          {/* Numbered marker */}
          <Text
            variant="display"
            color={colors.primary}
            style={[styles.slideNumber, { opacity: 0.3 }]}
          >
            {item.number}
          </Text>

          {/* Headline */}
          <Text
            variant="display"
            style={[styles.headline, { color: colors.text, fontSize: 48, lineHeight: 52 }]}
          >
            {item.headline}
          </Text>

          {/* Accent */}
          <Text variant="h2" color={colors.primary} style={styles.accentText}>
            {item.accent}
          </Text>

          {/* Footnote */}
          <Text variant="small" color={colors.textMuted} style={styles.footnote}>
            {item.footnote}
          </Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Skip — jumps to last slide */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        {!isLastSlide ? (
          <Pressable onPress={() => goToSlide(LAST_INDEX)} hitSlop={16}>
            <Text variant="small" color={colors.textMuted}>
              Skip
            </Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef as any}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        {/* Progress dots — state-driven, no scrollX width animation */}
        <View style={styles.progressBar}>
          {slides.map((_, i) => (
            <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
              <View
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: colors.primary,
                    width: i === activeIndex ? 28 : 12,
                    opacity: i === activeIndex ? 1 : 0.25,
                  },
                ]}
              />
            </Pressable>
          ))}
        </View>

        {isLastSlide ? (
          /* ── Auth section on slide 3 ── */
          <View style={styles.authSection}>
            {/* Google */}
            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                  borderRadius: theme.radius.md,
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleGoogle}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text
                    variant="bodySemibold"
                    style={[styles.googleIcon, { color: colors.text }]}
                  >
                    G
                  </Text>
                  <Text variant="bodySemibold" color={colors.text}>
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* Error */}
            {error ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: colors.errorBg, borderRadius: theme.radius.sm },
                ]}
              >
                <Text variant="small" color={colors.error}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Text variant="caption" color={colors.textMuted} center style={{ opacity: 0.45 }}>
              By continuing, you agree to our terms.
            </Text>
          </View>
        ) : (
          /* ── Next button ── */
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              {
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: theme.radius.md,
              },
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => goToSlide(activeIndex + 1)}
          >
            <Text variant="bodySemibold" color={colors.text}>
              Next
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: 24,
    alignItems: 'flex-end',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
  },
  slideContent: {
    paddingHorizontal: 32,
  },
  slideNumber: {
    fontSize: 64,
    lineHeight: 68,
    marginBottom: 4,
    letterSpacing: -2,
  },
  headline: {
    marginBottom: 16,
  },
  accentText: {
    marginBottom: 20,
    lineHeight: 32,
  },
  footnote: {
    lineHeight: 22,
    opacity: 0.7,
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 20,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  progressSegment: {
    height: 3,
    borderRadius: 2,
  },
  nextButton: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Auth
  authSection: {
    gap: 12,
  },
  googleButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorBox: {
    padding: 12,
  },
});
