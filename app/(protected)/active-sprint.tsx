import { useDropRule, useSprintRules } from '@/hooks/use-rule-queries';
import {
    useAbandonSprint,
    useActiveSprint,
    useCompleteSprint,
    useFinishCalibration,
} from '@/hooks/use-sprint-queries';
import { canModifyRules, getSprintDayNumber } from '@/lib/sprint-service';
import type { Database } from '@/types/database';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type SprintRule = Database['public']['Tables']['sprint_rules']['Row'];

export default function ActiveSprintScreen() {
  const router = useRouter();
  const { data: sprint, isLoading } = useActiveSprint();
  const { data: rules } = useSprintRules(sprint?.id);
  const abandonMutation = useAbandonSprint();
  const completeMutation = useCompleteSprint();
  const calibrationMutation = useFinishCalibration();
  const dropRuleMutation = useDropRule(sprint?.id ?? '');

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!sprint) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No active sprint</Text>
      </View>
    );
  }

  const dayNumber = getSprintDayNumber(sprint);
  const isCalibrationWindow = canModifyRules(sprint);
  const isLastDay = dayNumber >= sprint.duration_days;

  const handleLockRules = () => {
    Alert.alert(
      'Lock Rules',
      'Rules will be locked for the rest of this sprint. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock',
          onPress: () => calibrationMutation.mutate(sprint.id),
        },
      ],
    );
  };

  const handleDropRule = (rule: SprintRule) => {
    Alert.alert('Drop Rule', `Remove "${rule.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Drop',
        style: 'destructive',
        onPress: () => dropRuleMutation.mutate(rule.id),
      },
    ]);
  };

  const handleAbandon = () => {
    Alert.alert('Abandon Sprint', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: () => {
          abandonMutation.mutate(sprint.id, {
            onSuccess: () => router.replace('/(protected)/home'),
          });
        },
      },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Complete Sprint', 'Mark this sprint as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => {
          completeMutation.mutate(sprint.id, {
            onSuccess: () => router.replace('/(protected)/home'),
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {/* Sprint Header */}
      <View style={styles.header}>
        {sprint.title ? <Text style={styles.title}>{sprint.title}</Text> : null}
        <Text style={styles.dayIndicator}>
          Day {dayNumber} / {sprint.duration_days}
        </Text>
        <Text style={styles.dateRange}>
          {sprint.start_date} → {sprint.end_date}
        </Text>
      </View>

      {/* Calibration Banner */}
      {isCalibrationWindow ? (
        <View style={styles.calibrationBanner}>
          <Text style={styles.calibrationText}>
            Day 1 — You can add, drop, or adjust rules.
          </Text>
          <Pressable style={styles.lockButton} onPress={handleLockRules}>
            <Text style={styles.lockButtonText}>Lock Rules</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Rules */}
      <Text style={styles.sectionTitle}>Rules</Text>
      {rules?.map((rule) => (
        <View key={rule.id} style={styles.ruleRow}>
          <View style={styles.ruleInfo}>
            <Text style={styles.ruleTitle}>{rule.title}</Text>
            <Text style={styles.ruleType}>
              {rule.type === 'binary' ? 'Yes/No' : `Target: ${rule.target_value}`}
            </Text>
          </View>
          {isCalibrationWindow ? (
            <Pressable onPress={() => handleDropRule(rule)}>
              <Text style={styles.dropText}>Drop</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      {/* Add Rule during calibration */}
      {isCalibrationWindow && (rules?.length ?? 0) < 3 ? (
        <Pressable
          style={styles.addRuleButton}
          onPress={() =>
            router.push({
              pathname: '/(protected)/add-rule',
              params: { sprintId: sprint.id },
            })
          }
        >
          <Text style={styles.addRuleText}>+ Add Rule</Text>
        </Pressable>
      ) : null}

      {/* Daily Actions */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Today</Text>
      <View style={styles.dailyActions}>
        <Pressable
          style={({ pressed }) => [styles.dailyButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/(protected)/daily-check')}
        >
          <Text style={styles.dailyButtonText}>Daily Check</Text>
          <Text style={styles.dailyButtonSub}>Track your rules</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.dailyButton, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/(protected)/daily-entry')}
        >
          <Text style={styles.dailyButtonText}>Daily Entry</Text>
          <Text style={styles.dailyButtonSub}>One line about your day</Text>
        </Pressable>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {isLastDay ? (
          <Pressable
            style={({ pressed }) => [styles.completeButton, pressed && { opacity: 0.8 }]}
            onPress={handleComplete}
          >
            <Text style={styles.completeText}>Complete Sprint</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.abandonButton, pressed && { opacity: 0.8 }]}
          onPress={handleAbandon}
        >
          <Text style={styles.abandonText}>Abandon Sprint</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyText: {
    fontSize: 18,
    color: '#ccc',
    fontWeight: '600',
  },
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
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  dayIndicator: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 14,
    color: '#999',
  },
  calibrationBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  calibrationText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 8,
  },
  lockButton: {
    backgroundColor: '#92400e',
    borderRadius: 6,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  ruleType: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  dropText: {
    fontSize: 14,
    color: '#dc2626',
  },
  addRuleButton: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  addRuleText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    marginTop: 32,
    gap: 12,
  },
  completeButton: {
    height: 48,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  abandonButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  abandonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '500',
  },
  dailyActions: {
    gap: 12,
    marginBottom: 8,
  },
  dailyButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  dailyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  dailyButtonSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});
