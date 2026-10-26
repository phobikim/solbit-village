import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initDb } from '../src/data/db';
import { setupNotificationHandler } from '../src/notifications';
import { BottomBar } from '../src/ui/components/BottomBar';
import { useVisibleHeight } from '../src/ui/useVisibleHeight';
import { colors, fontFiles } from '../src/ui/theme';
import { injectWebStyles } from '../src/ui/webStyles';

SplashScreen.preventAutoHideAsync().catch(() => {});
injectWebStyles();
setupNotificationHandler();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFiles);
  // 웹: 모바일 브라우저의 주소창 · 툴바를 뺀 보이는 높이에 앱을 맞춘다 (100%는 보이는 영역보다 클 수 있다)
  const visibleHeight = useVisibleHeight();

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
      <View style={[styles.outer, Platform.OS === 'web' && visibleHeight > 0 ? { flexGrow: 0, flexShrink: 0, flexBasis: 'auto', height: visibleHeight } : null]}>
        <View style={styles.frame}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.night } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="record" options={{ presentation: 'modal' }} />
            <Stack.Screen name="seed-result" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
            <Stack.Screen name="morning-news" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
            <Stack.Screen name="settings" />
            <Stack.Screen name="neighbor-new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="ledger/new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="storage" />
            <Stack.Screen name="place-new" options={{ presentation: 'modal' }} />
            <Stack.Screen name="place-map" />
            <Stack.Screen name="rest-throw" options={{ presentation: 'modal' }} />
          </Stack>
          {/* 모든 화면에 항상 떠 있는 하단 바 (입력 시트 · 결과 카드는 위를 덮음) */}
          <BottomBar />
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
