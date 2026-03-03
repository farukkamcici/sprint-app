import { supabase } from '@/lib/supabase';
import type { AuthError } from '@supabase/supabase-js';
import { Linking } from 'react-native';

interface AuthResult {
  success: boolean;
  error: string | null;
}

export function formatError(error: AuthError | null): string | null {
  if (!error) return null;
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password.';
    case 'User already registered':
      return 'An account with this email already exists.';
    case 'Email not confirmed':
      return 'Please check your email to confirm your account.';
    default:
      return error.message;
  }
}

/**
 * Sign in with Google using Supabase OAuth (PKCE flow).
 * Opens the system browser → Google login → redirects back to sprint-app://google-auth?code=XXX
 * The google-auth.tsx route exchanges the code for a session.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const redirectUri = 'sprint-app://google-auth';

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { success: false, error: formatError(error) ?? 'Failed to start Google sign-in.' };
    }

    // Open system browser — google-auth.tsx handles the callback
    await Linking.openURL(data.url);

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message ?? 'An unexpected error occurred.' };
  }
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  return { success: !error, error: formatError(error) };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  return { success: !error, error: formatError(error) };
}

export async function signOut(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut();
  return { success: !error, error: formatError(error) };
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
  );
  return { success: !error, error: formatError(error) };
}
