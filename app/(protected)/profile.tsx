/**
 * Profile Screen
 *
 * Account management. Avatar, display name, theme toggle, sign out.
 * Clean settings page with premium feel.
 */

import { Avatar, Button, Card, Divider, Header, Screen, Text } from '@/components/ui';
import { signOut } from '@/lib/auth';
import { STORAGE_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storage';
import { useAuthStore } from '@/stores/auth-store';
import { useTheme } from '@/theme';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const { theme, isDark, toggleTheme } = useTheme();
  const colors = theme.colors;
  const router = useRouter();

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  const handleSignOut = async () => {
    storage.delete(STORAGE_KEYS.ONBOARDING_COMPLETE);
    await signOut();
  };

  return (
    <Screen scroll>
      <Header title="Profile" />

      {/* Avatar & name */}
      <View style={styles.profileSection}>
        <Avatar name={displayName} size="lg" />
        <View style={styles.profileInfo}>
          <Text variant="h2">{displayName}</Text>
          <Text variant="small" color={colors.textSecondary}>
            {email}
          </Text>
        </View>
      </View>

      <Divider />

      {/* Settings */}
      <View style={styles.settingsSection}>
        <Text variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          PREFERENCES
        </Text>

        {/* Theme toggle */}
        <Pressable
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={toggleTheme}
        >
          <View>
            <Text variant="bodyMedium">Appearance</Text>
            <Text variant="small" color={colors.textSecondary}>
              {isDark ? 'Dark mode' : 'Light mode'}
            </Text>
          </View>
          <View
            style={[
              styles.themeToggle,
              {
                backgroundColor: isDark ? colors.primary : colors.secondary,
                borderRadius: theme.radius.full,
              },
            ]}
          >
            <View
              style={[
                styles.themeKnob,
                {
                  backgroundColor: isDark ? colors.textOnPrimary : colors.text,
                  borderRadius: theme.radius.full,
                  transform: [{ translateX: isDark ? 18 : 0 }],
                },
              ]}
            />
          </View>
        </Pressable>

        {/* History */}
        <Pressable
          style={[styles.settingRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/(protected)/history')}
        >
          <View>
            <Text variant="bodyMedium">Streaks & History</Text>
            <Text variant="small" color={colors.textSecondary}>
              Past sprints and streaks
            </Text>
          </View>
          <Text variant="bodyMedium" color={colors.textMuted}>→</Text>
        </Pressable>
      </View>

      <Divider />

      {/* Account */}
      <View style={styles.accountSection}>
        <Text variant="label" color={colors.textMuted} style={styles.sectionLabel}>
          ACCOUNT
        </Text>

        <Card style={styles.tierCard}>
          <View style={styles.tierRow}>
            <View>
              <Text variant="bodyMedium">Free Tier</Text>
              <Text variant="small" color={colors.textSecondary}>
                1 active sprint · 3 sprint history
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Sign out */}
      <View style={styles.signOutSection}>
        <Button
          label="Sign Out"
          variant="ghost"
          size="md"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        <Text variant="caption" color={colors.textMuted} center style={styles.version}>
          Sprint v1.0.0
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  profileInfo: {
    alignItems: 'center',
    gap: 4,
  },
  settingsSection: {
    marginBottom: 8,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  themeToggle: {
    width: 44,
    height: 26,
    padding: 3,
    justifyContent: 'center',
  },
  themeKnob: {
    width: 20,
    height: 20,
  },
  accountSection: {
    marginBottom: 8,
  },
  tierCard: {
    gap: 8,
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signOutSection: {
    marginTop: 'auto',
    paddingTop: 24,
    paddingBottom: 8,
    gap: 16,
  },
  signOutButton: {
    opacity: 0.7,
  },
  version: {
    letterSpacing: 0.5,
  },
});
