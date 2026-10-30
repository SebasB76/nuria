import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Onest_400Regular, Onest_500Medium, Onest_700Bold, Onest_800ExtraBold } from '@expo-google-fonts/onest';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider } from '@/state/AppState';
import { FamilyProvider } from '@/state/FamilyState';
import { C } from '@/ui/theme';
import { ToastProvider } from '@/ui/Toast';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ BricolageGrotesque_800ExtraBold, Onest_400Regular, Onest_500Medium, Onest_700Bold, Onest_800ExtraBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppStateProvider>
          <FamilyProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
              <Stack.Screen name="report" options={{ presentation: 'modal' }} />
              <Stack.Screen name="season" options={{ presentation: 'modal' }} />
              <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
              <Stack.Screen name="danger" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            </Stack>
          </FamilyProvider>
        </AppStateProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
