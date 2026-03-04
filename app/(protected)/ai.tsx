/**
 * AI Assistant Screen
 *
 * Phase 7 — AI Integration placeholder.
 * Sprint Planning, Story Session, Weekly Meeting, Day 1 Calibration.
 */

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AIScreen() {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: insets.top + 24 }]}>
      {/* Glow blob */}
      <View
        style={[
          styles.glow,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ]}
      />

      {/* Icon */}
      <View style={[styles.iconRing, { borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}12` }]}>
        <View style={[styles.iconInner, { backgroundColor: `${colors.primary}22` }]}>
          <Sparkles size={32} color={colors.primary} strokeWidth={1.5} />
        </View>
      </View>

      {/* Heading */}
      <View style={styles.textBlock}>
        <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />
        <View>
          <Text variant="h1" style={styles.title}>
            AI Assistant
          </Text>
          <Text variant="bodyMedium" color={colors.textSecondary} style={styles.subtitle}>
            Sprint planning, daily coaching{'\n'}and story sessions — coming soon.
          </Text>
        </View>
      </View>

      {/* Feature pills */}
      <View style={styles.pills}>
        {['Sprint Planning', 'Story Session', 'Day 1 Calibration', 'Weekly Review'].map((f) => (
          <View
            key={f}
            style={[styles.pill, { backgroundColor: colors.bgCard, borderColor: colors.borderMuted }]}
          >
            <View style={[styles.pillDot, { backgroundColor: colors.primary }]} />
            <Text variant="small" color={colors.textSecondary}>
              {f}
            </Text>
          </View>
        ))}
      </View>

      <Text variant="caption" color={colors.textMuted} style={styles.note}>
        All AI sessions are time-limited and server-enforced.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 120,
  },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.06,
    top: '20%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 80,
    elevation: 0,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 32,
    alignSelf: 'flex-start',
  },
  accentBar: {
    width: 3,
    height: 52,
    borderRadius: 2,
    marginTop: 4,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
  },
  pills: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 40,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.7,
  },
  note: {
    textAlign: 'center',
    opacity: 0.5,
  },
});
