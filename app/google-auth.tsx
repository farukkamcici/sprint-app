import { supabase } from '@/lib/supabase';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

/**
 * OAuth callback route (PKCE flow).
 * Catches sprint-app://google-auth?code=XXX
 * Exchanges the authorization code for a Supabase session.
 */
export default function GoogleAuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function exchangeCode() {
      // Check for OAuth error
      if (params.error) {
        setErrorMsg(params.error_description ?? params.error);
        setStatus('error');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      // Extract the authorization code
      const code = params.code;
      if (!code) {
        setErrorMsg('No authorization code received.');
        setStatus('error');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
        return;
      }

      try {
        // Exchange code for session (PKCE)
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setErrorMsg(error.message);
          setStatus('error');
          setTimeout(() => router.replace('/(auth)/login'), 2000);
          return;
        }

        // Success — navigate to home
        router.replace('/(protected)/home');
      } catch (e: any) {
        setErrorMsg(e.message ?? 'Failed to complete sign-in.');
        setStatus('error');
        setTimeout(() => router.replace('/(auth)/login'), 2000);
      }
    }

    exchangeCode();
  }, [params.code, params.error, params.error_description]);

  return (
    <View style={styles.container}>
      {status === 'loading' ? (
        <>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.text}>Signing in...</Text>
        </>
      ) : (
        <Text style={styles.errorText}>{errorMsg}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
