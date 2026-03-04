/**
 * Google Auth Callback Screen
 *
 * OAuth PKCE callback handler. Exchanges code for session.
 */

import { Screen, Text } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function GoogleAuthCallback() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [error, setError] = useState<string | null>(null);
  const colors = useThemeColors();

  useEffect(() => {
    const exchangeCode = async () => {
      if (!params.code) {
        setError('No authorization code received.');
        setTimeout(() => router.replace('/(auth)/onboarding'), 2000);
        return;
      }
      try {
        const { error: authError } = await supabase.auth.exchangeCodeForSession(params.code);
        if (authError) throw authError;
        router.replace('/(protected)/home');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed.');
        setTimeout(() => router.replace('/(auth)/onboarding'), 2000);
      }
    };
    exchangeCode();
  }, [params.code]);

  return (
    <Screen>
      <View style={styles.container}>
        {error ? (
          <Text variant="small" color={colors.error} center>
            {error}
          </Text>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="bodyMedium" color={colors.textSecondary} style={styles.text}>
              Signing in...
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    marginTop: 8,
  },
});
