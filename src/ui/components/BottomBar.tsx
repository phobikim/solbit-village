// 하단 바 (design/ v5 TURN 7 개정 · 6탭: 마을 · 장부 · 이웃 · 쉼터 · 옷장 · 나, 디자인 TURN 27): 떠 있는 알약 모양, 활성 탭은 노란 알약. 모든 탭은 아이콘 위 · 글자 아래 세로 정렬이고, 선택해도 가로로 바뀌지 않는다 (2026-10-26).
// 탭 화면뿐 아니라 하위 화면(장부 · 수확 창고 · 설정 …)에도 항상 떠 있다. 입력 시트 · 결과 카드는 위를 덮는다.

import { router, usePathname } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { tabIconSvg, type TabIcon } from '../characters/icons';
import { hidesBottomBar, tabOfPath } from '../navigation';
import { colors, fonts } from '../theme';

type Tab = { key: TabIcon; label: string; href: '/' | '/records' | '/neighbors' | '/rest' | '/closet' | '/me' };

const TABS: readonly Tab[] = [
  { key: 'village', label: '마을', href: '/' },
  { key: 'records', label: '장부', href: '/records' },
  { key: 'neighbors', label: '이웃', href: '/neighbors' },
  { key: 'rest', label: '쉼터', href: '/rest' },
  { key: 'closet', label: '옷장', href: '/closet' },
  { key: 'me', label: '나', href: '/me' },
];

export function BottomBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  // 시트 · 결과 카드가 떠 있을 때는 그 아래 탭을 그대로 표시
  const last = useRef<TabIcon>('village');
  const current = tabOfPath(path) ?? last.current;
  last.current = current;
  if (hidesBottomBar(path)) return null;

  return (
    <View style={[styles.wrap, { marginBottom: 6 + insets.bottom }]} accessibilityRole="tablist">
      {TABS.map((t) => {
        const on = t.key === current;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
            onPress={() => router.navigate(t.href)}
            style={({ pressed }) => [styles.tab, on && styles.tabOn, pressed && !on && styles.pressed]}
          >
            <SvgXml xml={tabIconSvg(t.key, on ? colors.line : colors.textMuted, on ? 2.8 : 2.4)} width={22} height={22} />
            <Text style={[styles.label, on && styles.labelOn]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    marginHorizontal: 12,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: '#333C7A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  tab: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 26 },
  tabOn: {
    marginHorizontal: 2,
    backgroundColor: colors.yellow,
    borderBottomWidth: 3,
    borderBottomColor: '#C9A800',
  },
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
  labelOn: { color: colors.line },
});
