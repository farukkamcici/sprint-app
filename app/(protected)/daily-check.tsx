import { useSaveCheck, useTodayChecks } from '@/hooks/use-daily-queries';
import { useSprintRules } from '@/hooks/use-rule-queries';
import { useActiveSprint } from '@/hooks/use-sprint-queries';
import { getTodayDate } from '@/lib/daily-check-service';
import { getSprintDayNumber } from '@/lib/sprint-service';
import { syncAll } from '@/lib/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import type { Database } from '@/types/database';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type SprintRule = Database['public']['Tables']['sprint_rules']['Row'];

export default function DailyCheckScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: sprint } = useActiveSprint();
  const { data: rules } = useSprintRules(sprint?.id);
  const { data: existingChecks } = useTodayChecks(sprint?.id);
  const saveCheckMutation = useSaveCheck(sprint?.id ?? '');
  const [syncing, setSyncing] = useState(false);

  const dayNumber = sprint ? getSprintDayNumber(sprint) : 0;
  const today = getTodayDate();

  // Local state for check values before saving
  const [checkStates, setCheckStates] = useState<
    Record<string, { completed: boolean; value: number | null }>
  >({});

  // Initialize from existing checks
  const getCheckState = useCallback(
    (ruleId: string) => {
      if (checkStates[ruleId]) return checkStates[ruleId];
      const existing = existingChecks?.find((c) => c.rule_id === ruleId);
      if (existing) {
        return { completed: existing.completed, value: existing.value };
      }
      return { completed: false, value: null };
    },
    [checkStates, existingChecks],
  );

  const toggleBinary = (ruleId: string) => {
    const current = getCheckState(ruleId);
    const newState = { completed: !current.completed, value: null };
    setCheckStates((prev) => ({ ...prev, [ruleId]: newState }));
  };

  const setNumericValue = (ruleId: string, val: string) => {
    const num = val === '' ? null : parseFloat(val);
    setCheckStates((prev) => ({
      ...prev,
      [ruleId]: {
        completed: num !== null && !isNaN(num) && num > 0,
        value: num,
      },
    }));
  };

  const handleSave = async () => {
    if (!sprint || !user || !rules) return;

    for (const rule of rules) {
      const state = getCheckState(rule.id);
      saveCheckMutation.mutate({
        rule_id: rule.id,
        user_id: user.id,
        day_number: dayNumber,
        date: today,
        completed: state.completed,
        value: state.value,
      });
    }

    // Attempt background sync
    setSyncing(true);
    try {
      await syncAll();
    } catch {
      // Sync failed — data is safe in MMKV, will retry later
    } finally {
      setSyncing(false);
    }

    Alert.alert('Saved', 'Your daily checks have been recorded.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (!sprint) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No active sprint</Text>
      </View>
    );
  }

  const isOverdue = dayNumber > sprint.duration_days;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Daily Check</Text>
      <Text style={styles.subtitle}>
        Day {dayNumber} — {today}
      </Text>

      {isOverdue ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Sprint has ended. Complete or abandon it from the sprint screen.
          </Text>
        </View>
      ) : null}

      {rules?.map((rule) => (
        <RuleCheckItem
          key={rule.id}
          rule={rule}
          state={getCheckState(rule.id)}
          onToggle={() => toggleBinary(rule.id)}
          onValueChange={(val) => setNumericValue(rule.id, val)}
        />
      ))}

      {!rules?.length ? (
        <Text style={styles.noRules}>No rules added to this sprint yet.</Text>
      ) : null}

      <Pressable
        style={({ pressed }) => [
          styles.saveButton,
          pressed && { opacity: 0.8 },
          syncing && { opacity: 0.6 },
        ]}
        onPress={handleSave}
        disabled={syncing || isOverdue}
      >
        <Text style={styles.saveText}>
          {syncing ? 'Saving & Syncing...' : 'Save Checks'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ──────────── Rule Check Item ────────────

function RuleCheckItem({
  rule,
  state,
  onToggle,
  onValueChange,
}: {
  rule: SprintRule;
  state: { completed: boolean; value: number | null };
  onToggle: () => void;
  onValueChange: (val: string) => void;
}) {
  if (rule.type === 'binary') {
    return (
      <Pressable style={styles.ruleCard} onPress={onToggle}>
        <View style={styles.ruleRow}>
          <View
            style={[
              styles.checkbox,
              state.completed && styles.checkboxChecked,
            ]}
          >
            {state.completed ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : null}
          </View>
          <View style={styles.ruleContent}>
            <Text style={styles.ruleTitle}>{rule.title}</Text>
            <Text style={styles.ruleType}>Yes / No</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Numeric
  return (
    <View style={styles.ruleCard}>
      <View style={styles.ruleRow}>
        <View
          style={[
            styles.checkbox,
            state.completed && styles.checkboxChecked,
          ]}
        >
          {state.completed ? (
            <Text style={styles.checkmark}>✓</Text>
          ) : null}
        </View>
        <View style={styles.ruleContent}>
          <Text style={styles.ruleTitle}>{rule.title}</Text>
          <Text style={styles.ruleType}>
            Target: {rule.target_value ?? '—'}
          </Text>
        </View>
      </View>
      <TextInput
        style={styles.numericInput}
        placeholder="Enter value"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={state.value?.toString() ?? ''}
        onChangeText={onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  warningBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  warningText: {
    fontSize: 14,
    color: '#dc2626',
  },
  ruleCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ruleContent: {
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
  numericInput: {
    marginTop: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  noRules: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 24,
  },
  saveButton: {
    height: 52,
    backgroundColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
