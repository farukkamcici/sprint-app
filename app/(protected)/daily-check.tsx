/**
 * Daily Check Screen
 *
 * Rule-by-rule check-in. Binary toggles and numeric inputs.
 * MMKV-first, then sync. Premium checkbox UX with haptics.
 */

import { Button, Card, Checkbox, Header, Screen, Text } from '@/components/ui';
import { useSaveCheck, useTodayChecks } from '@/hooks/use-daily-queries';
import { useSprintRules } from '@/hooks/use-rule-queries';
import { useActiveSprint } from '@/hooks/use-sprint-queries';
import { getTodayDate } from '@/lib/daily-check-service';
import { getSprintDayNumber } from '@/lib/sprint-service';
import { syncAll } from '@/lib/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/theme';
import type { Database } from '@/types/database';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

type SprintRule = Database['public']['Tables']['sprint_rules']['Row'];

export default function DailyCheckScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: sprint } = useActiveSprint();
  const { data: rules } = useSprintRules(sprint?.id);
  const { data: existingChecks } = useTodayChecks(sprint?.id);
  const saveCheckMutation = useSaveCheck(sprint?.id ?? '');
  const [syncing, setSyncing] = useState(false);
  const { theme } = useTheme();
  const colors = theme.colors;

  const dayNumber = sprint ? getSprintDayNumber(sprint) : 0;
  const today = getTodayDate();

  const [checkStates, setCheckStates] = useState<
    Record<string, { completed: boolean; value: number | null }>
  >({});

  const getCheckState = useCallback(
    (ruleId: string) => {
      if (checkStates[ruleId]) return checkStates[ruleId];
      const existing = existingChecks?.find((c) => c.rule_id === ruleId);
      if (existing) return { completed: existing.completed, value: existing.value };
      return { completed: false, value: null };
    },
    [checkStates, existingChecks],
  );

  const toggleBinary = (ruleId: string) => {
    const current = getCheckState(ruleId);
    setCheckStates((prev) => ({
      ...prev,
      [ruleId]: { completed: !current.completed, value: null },
    }));
  };

  const setNumericValue = (ruleId: string, val: string) => {
    const num = val === '' ? null : parseFloat(val);
    setCheckStates((prev) => ({
      ...prev,
      [ruleId]: { completed: num !== null && !isNaN(num) && num > 0, value: num },
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
    setSyncing(true);
    try {
      await syncAll();
    } catch {}
    finally {
      setSyncing(false);
    }
    Alert.alert('Saved', 'Your daily checks have been recorded.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (!sprint) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text variant="h2" color={colors.textMuted}>No active sprint</Text>
        </View>
      </Screen>
    );
  }

  const isOverdue = dayNumber > sprint.duration_days;

  return (
    <Screen scroll keyboard>
      <Header title="Daily Check" />

      <View style={styles.header}>
        <Text variant="h1">Daily Check</Text>
        <Text variant="small" color={colors.textSecondary} style={styles.subtitle}>
          Day {dayNumber} — {today}
        </Text>
      </View>

      {isOverdue ? (
        <Card style={[styles.warningCard, { backgroundColor: colors.errorBg, borderWidth: 0 }]}>
          <Text variant="small" color={colors.error}>
            Sprint has ended. Complete or abandon it from the sprint screen.
          </Text>
        </Card>
      ) : null}

      {/* Rules */}
      <View style={styles.rulesContainer}>
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
          <Text variant="small" color={colors.textMuted} center style={styles.noRules}>
            No rules added to this sprint yet.
          </Text>
        ) : null}
      </View>

      <View style={styles.saveSection}>
        <Button
          label={syncing ? 'Saving & Syncing...' : 'Save Checks'}
          variant="primary"
          size="lg"
          loading={syncing}
          disabled={isOverdue}
          onPress={handleSave}
        />
      </View>
    </Screen>
  );
}

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
  const { theme } = useTheme();
  const colors = theme.colors;

  return (
    <Card style={styles.ruleCard}>
      <View style={styles.ruleRow}>
        <Checkbox checked={state.completed} onToggle={onToggle} />
        <View style={styles.ruleContent}>
          <Text variant="bodyMedium">{rule.title}</Text>
          <Text variant="caption" color={colors.textMuted}>
            {rule.type === 'binary' ? 'Yes / No' : `Target: ${rule.target_value ?? '—'}`}
          </Text>
        </View>
      </View>

      {rule.type === 'numeric' ? (
        <TextInput
          style={[
            styles.numericInput,
            {
              backgroundColor: colors.bgInput,
              borderColor: colors.border,
              borderRadius: theme.radius.md,
              color: colors.text,
              fontFamily: theme.typography.body.fontFamily,
              fontSize: theme.typography.body.fontSize,
            },
          ]}
          placeholder="Enter value"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={state.value?.toString() ?? ''}
          onChangeText={onValueChange}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 6,
  },
  warningCard: {
    marginBottom: 20,
  },
  rulesContainer: {
    gap: 12,
  },
  ruleCard: {
    gap: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ruleContent: {
    flex: 1,
    gap: 2,
  },
  numericInput: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  noRules: {
    marginVertical: 24,
  },
  saveSection: {
    marginTop: 28,
    paddingBottom: 8,
  },
});
