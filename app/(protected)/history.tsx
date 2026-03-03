import { useAllChecks } from '@/hooks/use-daily-queries';
import { useAllSprints, useSprintHistory } from '@/hooks/use-history-queries';
import { useSprintRules } from '@/hooks/use-rule-queries';
import { useActiveSprint } from '@/hooks/use-sprint-queries';
import { getSprintDayNumber } from '@/lib/sprint-service';
import {
    calculateDailyStreak,
    calculateSprintStreak
} from '@/lib/streak-service';
import type { Database } from '@/types/database';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Sprint = Database['public']['Tables']['sprints']['Row'];

export default function HistoryScreen() {
  const router = useRouter();
  const { data: activeSprint } = useActiveSprint();
  const { data: rules } = useSprintRules(activeSprint?.id);
  const { data: allChecks } = useAllChecks(activeSprint?.id);
  const { data: history, isLoading } = useSprintHistory(3);
  const { data: allSprints } = useAllSprints();

  const dailyStreak =
    activeSprint && allChecks && rules
      ? calculateDailyStreak(
          allChecks,
          rules.length,
          getSprintDayNumber(activeSprint),
        )
      : 0;

  const sprintStreak = allSprints
    ? calculateSprintStreak(allSprints)
    : 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Streaks & History</Text>

      {/* Streak Cards */}
      <View style={styles.streakRow}>
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{dailyStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>
        <View style={styles.streakCard}>
          <Text style={styles.streakNumber}>{sprintStreak}</Text>
          <Text style={styles.streakLabel}>Sprint Streak</Text>
        </View>
      </View>

      {/* Sprint History */}
      <Text style={styles.sectionTitle}>Past Sprints</Text>

      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : !history?.length ? (
        <Text style={styles.emptyText}>No completed sprints yet.</Text>
      ) : (
        history.map((sprint) => (
          <SprintHistoryCard key={sprint.id} sprint={sprint} />
        ))
      )}

      <Text style={styles.freeNote}>
        FREE tier shows last 3 sprints.
      </Text>
    </ScrollView>
  );
}

function SprintHistoryCard({ sprint }: { sprint: Sprint }) {
  const statusColor =
    sprint.status === 'completed' ? '#166534' : '#dc2626';
  const statusBg =
    sprint.status === 'completed' ? '#f0fdf4' : '#fef2f2';

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>
          {sprint.title ?? 'Untitled Sprint'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {sprint.status === 'completed' ? 'Completed' : 'Abandoned'}
          </Text>
        </View>
      </View>
      <Text style={styles.historyDates}>
        {sprint.start_date} → {sprint.end_date}
      </Text>
      <Text style={styles.historyDuration}>
        {sprint.duration_days} days
        {sprint.category ? ` · ${sprint.category}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
  },
  streakRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
  },
  streakLabel: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 14,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  historyCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyDates: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  historyDuration: {
    fontSize: 13,
    color: '#aaa',
  },
  freeNote: {
    fontSize: 12,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
});
