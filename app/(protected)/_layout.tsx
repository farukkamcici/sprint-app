import { useAuthStore } from '@/stores/auth-store';
import { Redirect, Stack } from 'expo-router';

export default function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
