import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDb } from '../src/data/db';
import { colors, fontFiles } from '../src/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFiles);

  useEffect(() => {
    initDb()
      .then(() => __DEV__ && console.log('[db] ready'))
      .catch((e) => console.warn('[db] init failed', e));
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={styles.outer}>
        <View style={styles.frame}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="record" options={{ presentation: 'modal' }} />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

// 웹(개발 확인용)에서는 휴대폰 폭으로 가운데 정렬
const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: colors.nightOuter, alignItems: 'center' },
  frame: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.night,
    ...(Platform.OS === 'web' ? { maxWidth: 430 } : null),
  },
});
