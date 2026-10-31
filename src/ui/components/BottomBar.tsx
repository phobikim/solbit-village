// 하단 바 (디자인 TURN 30 + 시트 9 아이콘 1a "컬러 스티커 · 노란 방울"): 5탭 장부 · 이웃 · 마을 · 쉼터 · 나, 마을이 가운데. 글자 없이 아이콘만.
// 바: 높이 64, 바깥 여백 위 6 · 좌우 12 · 아래 14, 둥글기 32, 배경 #232B60, 안쪽 링 2 #333C7A, 아래 그림자.
// 아이콘은 늘 컬러, 쉬는 탭은 반투명(.5, 32). 고른 탭은 노란 방울(58)에 담겨 위로 14 튀고 아이콘이 38로 커진다.
// 메인(마을) 화면에서는 장면 위에 떠 있다 (position absolute). 다른 화면에서는 화면 아래에 놓인다.
// 입력 시트 · 결과 카드는 위를 덮는다. 꾸미기처럼 탭 바가 없는 전체 화면에서는 숨긴다 (navigation.ts).

import { router, usePathname } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { hidesBottomBar, tabOfPath, type TabKey } from '../navigation';
import { TAB_BAR } from '../mainScene';
import { TAB_ICONS } from '../characters/tabIcons';
import { colors } from '../theme';

type Tab = { key: TabKey; label: string; href: '/' | '/records' | '/neighbors' | '/rest' | '/me' };

/** 글자는 화면에 그리지 않고 접근성 라벨로만 쓴다 */
const TABS: readonly Tab[] = [
  { key: 'records', label: '장부', href: '/records' },
  { key: 'neighbors', label: '이웃', href: '/neighbors' },
  { key: 'village', label: '마을', href: '/' },
  { key: 'rest', label: '쉼터', href: '/rest' },
  { key: 'me', label: '나', href: '/me' },
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
  const bubble = on ? 58 : 44;
  const icon = on ? 38 : 32;
  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
        accessibilityLabel={tab.label}
        onPress={() => router.navigate(tab.href)}
        style={({ pressed }) => [styles.tab, pressed && !on && styles.pressed]}
      >
        <View style={[styles.bubble, { width: bubble, height: bubble, borderRadius: bubble / 2 }, on && styles.bubbleOn]}>
          {on && <View style={[styles.ring, { width: bubble + 6, height: bubble + 6, borderRadius: (bubble + 6) / 2 }]} />}
          {on && <View style={[styles.gold, { width: bubble, height: bubble, borderRadius: bubble / 2 }]} />}
          {on && <View style={[styles.face, { width: bubble, height: bubble, borderRadius: bubble / 2 }]} />}
          <Svg width={icon} height={icon} viewBox="0 0 32 32" opacity={on ? 1 : 0.5} style={styles.icon}>
            {TAB_ICONS[tab.key].map((p, i) => (
              <Path key={i} d={p.d} fill={p.fill} stroke={p.stroke} strokeWidth={p.width} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </Svg>
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
  tab: { height: 56, alignItems: 'center', justifyContent: 'center' },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  // 시안: box-shadow 0 4px 0 #C9A800, 0 0 0 3px #232B60 — 바 색 테두리 위에 노란 방울 아래 단단한 그림자
  bubbleOn: { transform: [{ translateY: -14 }] },
  ring: { position: 'absolute', top: -3, left: -3, backgroundColor: colors.card },
  gold: { position: 'absolute', top: 4, left: 0, backgroundColor: '#C9A800' },
  face: { position: 'absolute', top: 0, left: 0, backgroundColor: colors.yellow },
  icon: { zIndex: 1 },
  pressed: { opacity: 0.7 },
});
