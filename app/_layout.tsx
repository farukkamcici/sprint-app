import { useAuthListener } from '@/hooks/use-auth-listener';
import { QueryProvider } from '@/lib/query-client';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

function AuthGate({ children }: { children: React.ReactNode }) {
  useAuthListener();
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthGate>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
    </QueryProvider>
  );
}
