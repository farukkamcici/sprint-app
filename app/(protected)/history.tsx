/**
 * History Screen
 *
 * Streaks and past sprints. Clean data presentation.
 * Warm accent on streak numbers. Premium card list.
 */

import { Badge, Card, Header, Screen, Text } from '@/components/ui';
import { useAllChecks } from '@/hooks/use-daily-queries';
import { useAllSprints, useSprintHistory } from '@/hooks/use-history-queries';
import { useSprintRules } from '@/hooks/use-rule-queries';
import { useActiveSprint } from '@/hooks/use-sprint-queries';
import { getSprintDayNumber } from '@/lib/sprint-service';
import { calculateDailyStreak, calculateSprintStreak } from '@/lib/streak-service';
import { useTheme } from '@/theme';
import type { Database } from '@/types/database';
import { StyleSheet, View } from 'react-native';

type Sprint = Database['public']['Tables']['sprints']['Row'];

export default function HistoryScreen() {
  const { data: activeSprint } = useActiveSprint();
  const { data: rules } = useSprintRules(activeSprint?.id);
  const { data: allChecks } = useAllChecks(activeSprint?.id);
  const { data: history, isLoading } = useSprintHistory(3);
  const { data: allSprints } = useAllSprints();
  const { theme } = useTheme();
  const colors = theme.colors;

  const dailyStreak =
    activeSprint && allChecks && rules
      ? calculateDailyStreak(allChecks, rules.length, getSprintDayNumber(activeSprint))
      : 0;

  const sprintStreak = allSprints ? calculateSprintStreak(allSprints) : 0;

  return (
    <Screen scroll>
      <Header title="History" />

      <Text variant="h1" style={styles.pageTitle}>Streaks & History</Text>

      {/* Streak cards */}
      <View style={styles.streakRow}>
        <Card
          style={[styles.streakCard, { backgroundColor: colors.primaryMuted, borderWidth: 0 }]}
        >
          <Text variant="number" color={colors.primary}>
            {dailyStreak}
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            DAY STREAK
          </Text>
        </Card>

        <Card
          style={[styles.streakCard, { backgroundColor: colors.primaryMuted, borderWidth: 0 }]}
        >
          <Text variant="number" color={colors.primary}>
            {sprintStreak}
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            SPRINT STREAK
          </Text>
        </Card>
      </View>

      {/* History section */}
      <View style={styles.historySection}>
        <Text variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          PAST SPRINTS
        </Text>

        {isLoading ? (
          <Text variant="small" color={colors.textMuted}>Loading...</Text>
        ) : !history?.length ? (
          <Text variant="small" color={colors.textMuted} center style={styles.emptyText}>
            No completed sprints yet.
          </Text>
        ) : (
          <View style={styles.historyList}>
            {history.map((sprint) => (
              <SprintHistoryCard key={sprint.id} sprint={sprint} />
            ))}
          </View>
        )}

        <Text variant="caption" color={colors.textMuted} center style={styles.freeNote}>
          FREE tier shows last 3 sprints.
        </Text>
      </View>
    </Screen>
  );
}

function SprintHistoryCard({ sprint }: { sprint: Sprint }) {
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Card style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text variant="bodyMedium" style={styles.historyTitle} numberOfLines={1}>
          {sprint.title ?? 'Untitled Sprint'}
        </Text>
        <Badge
          label={sprint.status === 'completed' ? 'Completed' : 'Abandoned'}
          variant={sprint.status === 'completed' ? 'success' : 'error'}
        />
      </View>
      <Text variant="small" color={colors.textSecondary}>
        {sprint.start_date} → {sprint.end_date}
      </Text>
      <Text variant="caption" color={colors.textMuted}>
        {sprint.duration_days} days
        {sprint.category ? ` · ${sprint.category}` : ''}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    marginBottom: 24,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 36,
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  historySection: {
    gap: 12,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: 4,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    gap: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyTitle: {
    flex: 1,
    marginRight: 8,
  },
  emptyText: {
    marginVertical: 24,
  },
  freeNote: {
    marginTop: 16,
    letterSpacing: 0.5,
  },
});
