/**
 * Active Sprint Screen
 *
 * Sprint command center. Day indicator, rules, daily actions.
 * Clean information architecture. Warm, confident styling.
 */

import { Button, Card, Header, Screen, Text } from '@/components/ui';
import { useDropRule, useSprintRules } from '@/hooks/use-rule-queries';
import {
    useAbandonSprint,
    useActiveSprint,
    useCompleteSprint,
    useFinishCalibration,
} from '@/hooks/use-sprint-queries';
import { canModifyRules, getSprintDayNumber } from '@/lib/sprint-service';
import { useTheme } from '@/theme';
import type { Database } from '@/types/database';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

type SprintRule = Database['public']['Tables']['sprint_rules']['Row'];

export default function ActiveSprintScreen() {
  const router = useRouter();
  const { data: sprint, isLoading } = useActiveSprint();
  const { data: rules } = useSprintRules(sprint?.id);
  const abandonMutation = useAbandonSprint();
  const completeMutation = useCompleteSprint();
  const calibrationMutation = useFinishCalibration();
  const dropRuleMutation = useDropRule(sprint?.id ?? '');
  const { theme } = useTheme();
  const colors = theme.colors;

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text variant="bodyMedium" color={colors.textMuted}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  if (!sprint) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text variant="h2" color={colors.textMuted}>No active sprint</Text>
        </View>
      </Screen>
    );
  }

  const dayNumber = getSprintDayNumber(sprint);
  const isCalibrationWindow = canModifyRules(sprint);
  const isLastDay = dayNumber >= sprint.duration_days;

  const handleLockRules = () => {
    Alert.alert('Lock Rules', 'Rules will be locked for the rest of this sprint.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Lock', onPress: () => calibrationMutation.mutate(sprint.id) },
    ]);
  };

  const handleDropRule = (rule: SprintRule) => {
    Alert.alert('Drop Rule', `Remove "${rule.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Drop', style: 'destructive', onPress: () => dropRuleMutation.mutate(rule.id) },
    ]);
  };

  const handleAbandon = () => {
    Alert.alert('Abandon Sprint', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Abandon',
        style: 'destructive',
        onPress: () => abandonMutation.mutate(sprint.id, {
          onSuccess: () => router.replace('/(protected)/home'),
        }),
      },
    ]);
  };

  const handleComplete = () => {
    Alert.alert('Complete Sprint', 'Mark this sprint as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => completeMutation.mutate(sprint.id, {
          onSuccess: () => router.replace('/(protected)/home'),
        }),
      },
    ]);
  };

  return (
    <Screen scroll>
      <Header />

      {/* Sprint header */}
      <View style={styles.sprintHeader}>
        {sprint.title ? (
          <Text variant="label" color={colors.primary} style={styles.sprintLabel}>
            {sprint.title.toUpperCase()}
          </Text>
        ) : null}

        <View style={styles.dayRow}>
          <Text variant="number">{dayNumber}</Text>
          <Text variant="h1" color={colors.textMuted} style={styles.dayTotal}>
            / {sprint.duration_days}
          </Text>
        </View>

        <Text variant="small" color={colors.textSecondary}>
          {sprint.start_date} → {sprint.end_date}
        </Text>
      </View>

      {/* Calibration banner */}
      {isCalibrationWindow ? (
        <Card
          style={[styles.calibrationCard, { backgroundColor: colors.warningBg }]}
        >
          <Text variant="smallMedium" color={colors.warning}>
            Day 1 — You can add, drop, or adjust rules.
          </Text>
          <Button
            label="Lock Rules"
            variant="primary"
            size="sm"
            onPress={handleLockRules}
            style={styles.lockButton}
          />
        </Card>
      ) : null}

      {/* Rules */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          RULES
        </Text>
        {rules?.map((rule) => (
          <View
            key={rule.id}
            style={[styles.ruleRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.ruleInfo}>
              <Text variant="bodyMedium">{rule.title}</Text>
              <Text variant="caption" color={colors.textMuted}>
                {rule.type === 'binary' ? 'Yes / No' : `Target: ${rule.target_value}`}
              </Text>
            </View>
            {isCalibrationWindow ? (
              <Pressable onPress={() => handleDropRule(rule)} hitSlop={8}>
                <Text variant="smallMedium" color={colors.error}>Drop</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        {isCalibrationWindow && (rules?.length ?? 0) < 3 ? (
          <Pressable
            style={[
              styles.addRuleButton,
              { borderColor: colors.border, borderRadius: theme.radius.md },
            ]}
            onPress={() =>
              router.push({
                pathname: '/(protected)/add-rule',
                params: { sprintId: sprint.id },
              })
            }
          >
            <Text variant="smallMedium" color={colors.textMuted}>+ Add Rule</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Daily actions */}
      <View style={styles.section}>
        <Text variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          TODAY
        </Text>

        <View style={styles.dailyActions}>
          <Card
            onPress={() => router.push('/(protected)/daily-check')}
            style={styles.dailyCard}
          >
            <Text variant="bodySemibold">Daily Check</Text>
            <Text variant="small" color={colors.textSecondary}>
              Track your rules
            </Text>
          </Card>

          <Card
            onPress={() => router.push('/(protected)/daily-entry')}
            style={styles.dailyCard}
          >
            <Text variant="bodySemibold">Daily Entry</Text>
            <Text variant="small" color={colors.textSecondary}>
              One line about your day
            </Text>
          </Card>
        </View>
      </View>

      {/* Sprint actions */}
      <View style={styles.sprintActions}>
        {isLastDay ? (
          <Button
            label="Complete Sprint"
            variant="primary"
            size="lg"
            onPress={handleComplete}
          />
        ) : null}

        <Button
          label="Abandon Sprint"
          variant="destructive"
          size="md"
          onPress={handleAbandon}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sprintHeader: {
    marginBottom: 28,
  },
  sprintLabel: {
    letterSpacing: 1,
    marginBottom: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  dayTotal: {
    marginLeft: 4,
  },
  calibrationCard: {
    marginBottom: 24,
    gap: 12,
    borderWidth: 0,
  },
  lockButton: {
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  ruleInfo: {
    flex: 1,
    gap: 2,
  },
  addRuleButton: {
    height: 44,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dailyActions: {
    gap: 12,
  },
  dailyCard: {
    gap: 4,
  },
  sprintActions: {
    gap: 12,
    marginTop: 8,
    paddingBottom: 8,
  },
});
