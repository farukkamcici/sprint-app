import { supabase } from '@/lib/supabase';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import type { AuthError } from '@supabase/supabase-js';

interface AuthResult {
  success: boolean;
  error: string | null;
}

// Configure once — call this early (e.g. in _layout.tsx or here at module load)
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  scopes: ['email', 'profile'],
});

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
 * Sign in with Google — native account picker, no browser.
 * Flow: GoogleSignin.signIn() → idToken → supabase.signInWithIdToken()
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();

    // New API: response.data contains the user info and tokens
    const idToken = response.data?.idToken ?? (response as any).idToken ?? null;

    if (!idToken) {
      return { success: false, error: 'Google sign-in did not return a token.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    if (error) {
      return { success: false, error: formatError(error) ?? 'Supabase sign-in failed.' };
    }

    return { success: true, error: null };
  } catch (err: any) {
    if (err.code === statusCodes.SIGN_IN_CANCELLED) {
      return { success: false, error: null }; // user cancelled — not an error
    }
    if (err.code === statusCodes.IN_PROGRESS) {
      return { success: false, error: 'Sign-in already in progress.' };
    }
    if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { success: false, error: 'Google Play Services not available.' };
    }
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
