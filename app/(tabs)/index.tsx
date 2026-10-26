// 7a 마을 (메인). 기록·밭·경험치를 SQLite에서 읽어 마을을 그린다.
// 메인은 스크롤이 없다. 고정 요소(헤더 · 방송 · 지수 · 기록 버튼)를 먼저 놓고 남는 높이는 전부 마을 장면이 가져간다.
// 높이 규칙과 압축 단계는 src/ui/layout.ts (SPEC 11장).

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VILLAGE_NAME, VILLAGE_TAGLINE } from '../../src/copy/labels.ko';
import { today as getToday } from '../../src/domain/day';
import { useFarm } from '../../src/state/farm';
import { useLedger, useSkins } from '../../src/state/ledger';
import { useNeighbors } from '../../src/state/neighbors';
import { needsMorningNews } from '../../src/state/newsView';
import { usePlaces } from '../../src/state/places';
import { useRecords } from '../../src/state/records';
import { useRestLogs } from '../../src/state/restLogs';
import { useVillageView, villageRange } from '../../src/state/villageView';
import { VillageScene } from '../../src/ui/characters';
import { BroadcastLine } from '../../src/ui/components/BroadcastLine';
import { IndexCard } from '../../src/ui/components/IndexCard';
import { LevelBar } from '../../src/ui/components/LevelBar';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { mainLayout, SCENE_MIN_HEIGHT } from '../../src/ui/layout';
import { useVisibleHeight } from '../../src/ui/useVisibleHeight';
import { colors, fonts, radius } from '../../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** 게시판을 누르면 장부 · 대소사 */
const openBoard = () => router.push({ pathname: '/records', params: { view: 'events' } });

export default function VillageScreen() {
  const today = getToday();
  const loadRange = useRecords((s) => s.loadRange);
  const loadFarm = useFarm((s) => s.load);
  const loadNeighbors = useNeighbors((s) => s.load);
  const loadLedger = useLedger((s) => s.load);
  const loadSkins = useSkins((s) => s.load);
  const loadPlaces = usePlaces((s) => s.load);
  const loadRestLogs = useRestLogs((s) => s.load);
  const [now, setNow] = useState(() => new Date());
  const v = useVillageView(today, now);

  // 사용 가능 높이 = 보이는 높이(웹은 window.innerHeight) − 위 안전 영역 − (탭 바 + 아래 안전 영역)
  const visibleHeight = useVisibleHeight();
  const insets = useSafeAreaInsets();
  const L = mainLayout(visibleHeight, insets.top, insets.bottom);

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      // 그날 처음 열면 밤사이 마을 소식부터
      needsMorningNews(today)
        .then((show) => show && router.push('/morning-news'))
        .catch((e) => console.warn('[news] check failed', e));
      const { from, to } = villageRange(today);
      Promise.all([loadRange(from, to), loadFarm(), loadNeighbors(), loadLedger(), loadSkins(), loadPlaces(), loadRestLogs()]).catch((e) =>
        console.warn('[village] load failed', e),
      );
    }, [today, loadRange, loadFarm, loadNeighbors, loadLedger, loadSkins, loadPlaces, loadRestLogs]),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID={`main-layout-step-${L.step}`}>
      <View style={[styles.header, { height: L.header }]}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title}>{VILLAGE_NAME}</Text>
            {L.showTagline && <Text style={styles.tagline}>{VILLAGE_TAGLINE}</Text>}
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{v.level.level}</Text>
          </View>
        </View>
        <LevelBar current={v.level.into} goal={v.level.needed} height={L.showTagline ? 22 : 20} />
      </View>

      <View style={{ marginTop: L.gap, zIndex: 20 }}>
        <BroadcastLine message={v.broadcast} time={timeLabel(now)} fixed={{ height: L.broadcast, lines: L.broadcastLines }} />
      </View>

      {/* 마을 무대: 탭하는 장치는 없다 (규칙 5). 수확은 자동이다. 남는 높이는 전부 장면. */}
      <View testID="main-scene" style={[styles.scene, { marginTop: L.gap, minHeight: L.step === 4 ? SCENE_MIN_HEIGHT : 0 }]}>
        <VillageScene {...v.scene} onBoardPress={openBoard} />
      </View>

      {/* 지수 영역은 항상 보인다. 누르면 나 탭의 4주 추세로 */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="지수 추세 보기 (나 탭)"
        onPress={() => router.navigate('/me')}
        style={[styles.indices, { marginTop: L.gap, height: L.indices }]}
      >
        {v.indices.map((it) => (
          <IndexCard key={it.kind} {...it} variant={L.indexVariant} height={L.indices} />
        ))}
      </Pressable>

      <PrimaryButton
        label={v.recordedToday ? '오늘 기록 고치기' : '오늘 기록하기'}
        onPress={() => router.push('/record')}
        style={[styles.cta, { marginTop: L.gap, height: L.cta }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  header: { paddingTop: 2, paddingHorizontal: 20, paddingBottom: 2, justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleCol: { gap: 0 },
  title: { fontFamily: fonts.title, fontSize: 26, lineHeight: 30, color: colors.yellow },
  tagline: { fontFamily: fonts.bodyHeavy, fontSize: 13, lineHeight: 14, color: colors.pinkSoft },
  levelBadge: {
    backgroundColor: colors.pink,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    shadowColor: colors.pink,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  levelText: { fontFamily: fonts.title, fontSize: 20, lineHeight: 26, color: colors.line },
  scene: {
    flex: 1,
    marginHorizontal: 12,
    borderRadius: radius.scene,
    overflow: 'hidden',
    backgroundColor: '#141A44',
  },
  indices: { flexDirection: 'row', gap: 8, marginHorizontal: 12 },
  cta: { marginHorizontal: 16 },
});
