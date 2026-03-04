 /**
 * Login Screen — Redirect
 *
 * Auth is now handled on the final onboarding slide.
 * This file exists as a safety redirect.
 */

import { Redirect } from 'expo-router';

export default function LoginScreen() {
  return <Redirect href="/(auth)/onboarding" />;
}
