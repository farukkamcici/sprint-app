import { supabase } from '@/lib/supabase';
import type { AuthError } from '@supabase/supabase-js';

interface AuthResult {
  success: boolean;
  error: string | null;
}

function formatError(error: AuthError | null): string | null {
  if (!error) return null;
  // Provide user-friendly messages for common errors
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
