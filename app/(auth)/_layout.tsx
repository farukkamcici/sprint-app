import { useAuthStore } from '@/stores/auth-store';
import { Redirect, Stack } from 'expo-router';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  // If auth state resolves and user is already signed in, push them home
  if (!isLoading && isAuthenticated) {
    return <Redirect href="/(protected)/home" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
