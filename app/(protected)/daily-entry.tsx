import { useDailyEntry, useSaveEntry } from '@/hooks/use-daily-queries';
import { useActiveSprint } from '@/hooks/use-sprint-queries';
import { getTodayDate } from '@/lib/daily-check-service';
import { getSprintDayNumber } from '@/lib/sprint-service';
import { syncAll } from '@/lib/sync-service';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function DailyEntryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: sprint } = useActiveSprint();

  const dayNumber = sprint ? getSprintDayNumber(sprint) : 0;
  const today = getTodayDate();

  const { data: existingEntry } = useDailyEntry(sprint?.id, dayNumber);
  const saveEntryMutation = useSaveEntry(sprint?.id ?? '');

  const [content, setContent] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize text from existing entry (only once)
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

    // Background sync
    setSyncing(true);
    try {
      await syncAll();
    } catch {
      // Data safe in MMKV
    } finally {
      setSyncing(false);
    }

    Alert.alert('Saved', 'Your daily entry has been recorded.', [
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title}>Daily Entry</Text>
        <Text style={styles.subtitle}>
          Day {dayNumber} — {today}
        </Text>

        {isSynced ? (
          <View style={styles.syncedBanner}>
            <Text style={styles.syncedText}>
              This entry has been synced and is now immutable.
            </Text>
          </View>
        ) : null}

        <TextInput
          style={[styles.textArea, isSynced && styles.textAreaLocked]}
          multiline
          placeholder="One line about your day..."
          placeholderTextColor="#bbb"
          value={content}
          onChangeText={setContent}
          editable={!isSynced}
          maxLength={280}
          textAlignVertical="top"
        />

        <Text style={styles.charCount}>{content.length} / 280</Text>

        {!isSynced ? (
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && { opacity: 0.8 },
              syncing && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={syncing}
          >
            <Text style={styles.saveText}>
              {syncing ? 'Saving & Syncing...' : 'Save Entry'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: '#fff',
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
  syncedBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  syncedText: {
    fontSize: 14,
    color: '#166534',
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    color: '#000',
    lineHeight: 22,
    backgroundColor: '#fafafa',
  },
  textAreaLocked: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 8,
  },
  saveButton: {
    height: 52,
    backgroundColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});
