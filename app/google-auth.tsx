/**
 * Google Auth Callback — No longer used.
 * Native Google Sign-In flow (via @react-native-google-signin) handles auth
 * entirely in-app. This route exists only as a safety fallback.
 */

import { Redirect } from 'expo-router';

export default function GoogleAuthCallback() {
  return <Redirect href="/(auth)/onboarding" />;
}
