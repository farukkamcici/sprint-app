import { FloatingTabBar } from '@/components/FloatingTabBar';
import { useAuthStore } from '@/stores/auth-store';
import { Redirect, Tabs } from 'expo-router';

export default function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* Visible tabs */}
      <Tabs.Screen name="home" />
      <Tabs.Screen name="ai" />
      <Tabs.Screen name="profile" />

      {/* Push screens — hidden from tab bar, lazy to avoid Fabric view bloat */}
      <Tabs.Screen name="create-sprint"  options={{ href: null, lazy: true, unmountOnBlur: true }} />
      <Tabs.Screen name="add-rule"        options={{ href: null, lazy: true, unmountOnBlur: true }} />
      <Tabs.Screen name="daily-check"    options={{ href: null, lazy: true, unmountOnBlur: true }} />
      <Tabs.Screen name="daily-entry"    options={{ href: null, lazy: true, unmountOnBlur: true }} />
      <Tabs.Screen name="history"        options={{ href: null, lazy: true, unmountOnBlur: true }} />
    </Tabs>
  );
}
