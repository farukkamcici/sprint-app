import { useAuthListener } from '@/hooks/use-auth-listener';
import { useBackgroundSync } from '@/hooks/use-background-sync';
import { QueryProvider } from '@/lib/query-client';
import { ThemeProvider } from '@/theme';
import {
    FunnelDisplay_300Light,
    FunnelDisplay_400Regular,
    FunnelDisplay_500Medium,
    FunnelDisplay_600SemiBold,
    FunnelDisplay_700Bold,
    FunnelDisplay_800ExtraBold,
} from '@expo-google-fonts/funnel-display';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

// Prevent splash screen from auto-hiding before fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate({ children }: { children: React.ReactNode }) {
  useAuthListener();
  useBackgroundSync();
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    FunnelDisplay_300Light,
    FunnelDisplay_400Regular,
    FunnelDisplay_500Medium,
    FunnelDisplay_600SemiBold,
    FunnelDisplay_700Bold,
    FunnelDisplay_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: '#0C0A09' }} />;
  }

  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }} />
        </AuthGate>
      </QueryProvider>
    </ThemeProvider>
  );
}
