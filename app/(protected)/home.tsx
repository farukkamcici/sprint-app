import { useActiveSprint } from '@/hooks/use-sprint-queries';
import { signOut } from '@/lib/auth';
import { getSprintDayNumber } from '@/lib/sprint-service';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { data: activeSprint, isLoading: sprintLoading } = useActiveSprint();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Sprint</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.content}>
        {sprintLoading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : activeSprint ? (
          <Pressable
            style={({ pressed }) => [styles.sprintCard, pressed && { opacity: 0.9 }]}
            onPress={() => router.push('/(protected)/active-sprint')}
          >
            {activeSprint.title ? (
              <Text style={styles.sprintTitle}>{activeSprint.title}</Text>
            ) : null}
            <Text style={styles.dayText}>
              Day {getSprintDayNumber(activeSprint)} / {activeSprint.duration_days}
            </Text>
            <Text style={styles.dateText}>
              {activeSprint.start_date} → {activeSprint.end_date}
            </Text>
            <Text style={styles.tapHint}>Tap to view →</Text>
          </Pressable>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.empty}>No active sprint</Text>
            <Pressable
              style={({ pressed }) => [styles.createButton, pressed && { opacity: 0.8 }]}
              onPress={() => router.push('/(protected)/create-sprint')}
            >
              <Text style={styles.createButtonText}>Start a Sprint</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.signOutButton,
          pressed && styles.signOutPressed,
        ]}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sprintCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#fafafa',
  },
  sprintTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  dayText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  tapHint: {
    fontSize: 13,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
  },
  empty: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ccc',
  },
  createButton: {
    height: 48,
    backgroundColor: '#000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutPressed: {
    opacity: 0.6,
  },
  signOutText: {
    fontSize: 14,
    color: '#dc2626',
  },
});
