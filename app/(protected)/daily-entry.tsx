/**
 * Daily Entry Screen
 *
 * One-line daily reflection. Immutable once synced.
 * Clean text input. Minimal and intentional.
 */

import { Button, Card, Header, Screen, Text } from '@/components/ui';
import { useDailyEntry, useSaveEntry } from '@/hooks/use-daily-queries';
import { useActiveSprint } from '@/hooks/use-sprint-queries';
import { getTodayDate } from '@/lib/daily-check-service';
import { getSprintDayNumber } from '@/lib/sprint-service';
import { syncAll } from '@/lib/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/theme';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

export default function DailyEntryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: sprint } = useActiveSprint();
  const { theme } = useTheme();
  const colors = theme.colors;

  const dayNumber = sprint ? getSprintDayNumber(sprint) : 0;
  const today = getTodayDate();

  const { data: existingEntry } = useDailyEntry(sprint?.id, dayNumber);
  const saveEntryMutation = useSaveEntry(sprint?.id ?? '');

  const [content, setContent] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (existingEntry && !initialized) {
    setContent(existingEntry.content);
    setInitialized(true);
  }

  const isSynced = existingEntry?.synced === true;

  const handleSave = async () => {
    if (!sprint || !user) return;
    if (!content.trim()) {
      Alert.alert('Empty', 'Write something before saving.');
      return;
    }
    if (isSynced) {
      Alert.alert('Locked', 'This entry has already been synced and cannot be edited.');
      return;
    }
    saveEntryMutation.mutate({
      user_id: user.id,
      day_number: dayNumber,
      date: today,
      content: content.trim(),
    });
    setSyncing(true);
    try {
      await syncAll();
    } catch {}
    finally {
      setSyncing(false);
    }
    Alert.alert('Saved', 'Your daily entry has been recorded.', [
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

  return (
    <Screen keyboard>
      <Header title="Daily Entry" />

      <View style={styles.header}>
        <Text variant="h1">Daily Entry</Text>
        <Text variant="small" color={colors.textSecondary} style={styles.subtitle}>
          Day {dayNumber} — {today}
        </Text>
      </View>

      {isSynced ? (
        <Card
          style={[styles.syncedCard, { backgroundColor: colors.successBg, borderWidth: 0 }]}
        >
          <Text variant="small" color={colors.success}>
            This entry has been synced and is now immutable.
          </Text>
        </Card>
      ) : null}

      <View style={styles.entryContainer}>
        <Text variant="label" color={colors.textMuted} style={styles.prompt}>
          ONE LINE.
        </Text>

        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
              borderRadius: theme.radius.lg,
              color: colors.text,
              fontFamily: theme.typography.body.fontFamily,
              fontSize: theme.typography.body.fontSize,
              lineHeight: theme.typography.body.lineHeight,
            },
            isSynced && { opacity: 0.6 },
          ]}
          multiline
          placeholder="What happened today..."
          placeholderTextColor={colors.textMuted}
          value={content}
          onChangeText={setContent}
          editable={!isSynced}
          maxLength={280}
          textAlignVertical="top"
        />

        <Text variant="caption" color={colors.textMuted} style={styles.charCount}>
          {content.length} / 280
        </Text>
      </View>

      {!isSynced ? (
        <View style={styles.saveSection}>
          <Button
            label={syncing ? 'Saving & Syncing...' : 'Save Entry'}
            variant="primary"
            size="lg"
            loading={syncing}
            onPress={handleSave}
          />
        </View>
      ) : null}
    </Screen>
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
  syncedCard: {
    marginBottom: 20,
  },
  entryContainer: {
    flex: 1,
  },
  prompt: {
    letterSpacing: 2,
    marginBottom: 12,
  },
  textArea: {
    height: 140,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 8,
  },
  saveSection: {
    marginTop: 24,
    paddingBottom: 8,
  },
});
