// 하단 바 (디자인 TURN 30): 5탭 장부 · 이웃 · 마을 · 쉼터 · 나, 마을이 가운데.
// 바: 높이 64, 바깥 여백 위 6 · 좌우 12 · 아래 14, 둥글기 32, 배경 #232B60, 안쪽 링 2 #333C7A, 아래 그림자.
// 활성 탭은 노랑 알약. 마을이 활성이면 더 크고(60) 9만큼 위로 올라오고, 다른 탭이 활성이면 52.
// 메인(마을) 화면에서는 장면 위에 떠 있다 (position absolute). 다른 화면에서는 화면 아래에 놓인다.
// 입력 시트 · 결과 카드는 위를 덮는다. 옷장처럼 탭 바가 없는 전체 화면에서는 숨긴다 (navigation.ts).

import { router, usePathname } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { hidesBottomBar, tabOfPath, type TabKey } from '../navigation';
import { TAB_BAR } from '../mainScene';
import { colors, fonts } from '../theme';

type Tab = { key: TabKey; label: string; href: '/' | '/records' | '/neighbors' | '/rest' | '/me'; icon: readonly string[] };

/** 아이콘 path는 시안 v12 tabs() 상수 그대로 */
const TABS: readonly Tab[] = [
  { key: 'records', label: '장부', href: '/records', icon: ['M7.5 3.5h9A2.5 2.5 0 0 1 19 6v12a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18V6a2.5 2.5 0 0 1 2.5-2.5z', 'M9 3.5v17M12.5 8.5h3M12.5 12h3'] },
  { key: 'neighbors', label: '이웃', href: '/neighbors', icon: ['M6 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M3.5 19a5.5 5.5 0 0 1 11 0', 'M14.6 9a2.4 2.4 0 1 0 4.8 0a2.4 2.4 0 1 0-4.8 0', 'M15.5 13.6A4.5 4.5 0 0 1 21 18'] },
  { key: 'village', label: '마을', href: '/', icon: ['M4 11l8-6 8 6v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z', 'M10 20v-5h4v5'] },
  { key: 'rest', label: '쉼터', href: '/rest', icon: ['M2.5 10.5Q8 9.5 12 4q4 5.5 9.5 6.5', 'M5 10.5h14M7 10.5V20M17 10.5V20M4.5 20h15'] },
  { key: 'me', label: '나', href: '/me', icon: ['M8.5 9a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', 'M5.5 20a6.5 6.5 0 0 1 13 0'] },
];

export function BottomBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  // 시트 · 결과 카드가 떠 있을 때는 그 아래 탭을 그대로 표시
  const last = useRef<TabKey>('village');
  const current = tabOfPath(path) ?? last.current;
  last.current = current;
  if (hidesBottomBar(path)) return null;
  const floating = path === '/' || path === '/index';

  return (
    <View
      style={[
        styles.wrap,
        floating ? { position: 'absolute', left: TAB_BAR.marginSide, right: TAB_BAR.marginSide, bottom: TAB_BAR.marginBottom + insets.bottom } : { marginBottom: TAB_BAR.marginBottom + insets.bottom },
      ]}
      accessibilityRole="tablist"
    >
      {TABS.map((t) => (
        <TabButton key={t.key} tab={t} on={t.key === current} />
      ))}
    </View>
  );
}

function TabButton({ tab, on }: { tab: Tab; on: boolean }) {
  const mid = tab.key === 'village';
  const big = on && mid;
  const h = big ? 60 : 52;
  const r = big ? 24 : 26;
  const iconSize = on ? (mid ? 22 : 18) : mid ? 24 : 22;
  const ink = on ? colors.line : colors.textMuted;
  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={tab.label}
        onPress={() => router.navigate(tab.href)}
        style={({ pressed }) => [styles.tab, { height: h }, big && { transform: [{ translateY: -9 }] }, pressed && !on && styles.pressed]}
      >
        {on && <View style={[styles.under, { top: 3, height: h, borderRadius: r }]} />}
        <View style={[styles.pill, { height: h, borderRadius: r }, on && styles.pillOn]}>
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={on ? 2.8 : 2.4} strokeLinecap="round" strokeLinejoin="round">
            {tab.icon.map((d) => (
              <Path key={d} d={d} />
            ))}
          </Svg>
          <Text style={[styles.label, { color: ink, fontSize: big ? 12 : 11 }]} numberOfLines={1}>
            {tab.label}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: TAB_BAR.marginTop,
    marginHorizontal: TAB_BAR.marginSide,
    height: TAB_BAR.height,
    borderRadius: 32,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: '#333C7A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    zIndex: 20,
  },
  cell: { flex: 1, minWidth: 0, justifyContent: 'center' },
  tab: { justifyContent: 'center' },
  pill: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  pillOn: { backgroundColor: colors.yellow },
  under: { position: 'absolute', left: 0, right: 0, backgroundColor: '#C9A800' },
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.bodyHeavy },
});
