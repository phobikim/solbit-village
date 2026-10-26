// 7a 마을 (메인). 기록·밭·경험치를 SQLite에서 읽어 마을을 그린다.
// 구성 순서: 헤더 → 방송 → 마을 장면(4:3 고정) → 지수 → 밭 띠 → 오늘 기록하기 → 탭 바.
// 장면 비율은 절대 바꾸지 않고, 높이가 모자라면 나머지를 압축한다. 그래도 안 들어가면 메인만 스크롤 (탭 바 고정).
// 높이 규칙과 압축 단계는 src/ui/layout.ts (SPEC 11장).

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VILLAGE_NAME } from '../../src/copy/labels.ko';
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
import { FieldStrip } from '../../src/ui/components/FieldStrip';
import { IndexCard } from '../../src/ui/components/IndexCard';
import { LevelBar } from '../../src/ui/components/LevelBar';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { contentWidth, MAIN_LAYOUT, mainLayout } from '../../src/ui/layout';
import { colors, fonts, radius } from '../../src/ui/theme';
import { useVisibleHeight } from '../../src/ui/useVisibleHeight';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** 게시판을 누르면 장부 · 대소사 */
const openBoard = () => router.push({ pathname: '/records', params: { view: 'events' } });

const SIDE = MAIN_LAYOUT.sidePadding;

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
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const L = mainLayout(visibleHeight, insets.top, insets.bottom, contentWidth(windowWidth));

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

  const body: ReactNode = (
    <>
      <View style={[styles.header, { height: L.header }]}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{VILLAGE_NAME}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{v.level.level}</Text>
          </View>
        </View>
        <LevelBar current={v.level.into} goal={v.level.needed} height={22} />
      </View>

      <View style={{ marginTop: L.gap, zIndex: 20 }}>
        <BroadcastLine message={v.broadcast} time={timeLabel(now)} fixed={{ height: L.broadcast, lines: L.broadcastLines }} />
      </View>

      {/* 마을 무대 4:3 고정: 탭하는 장치는 없다 (규칙 5). 수확은 자동이다. */}
      <View testID="main-scene" style={[styles.scene, { marginTop: L.gap, width: L.sceneWidth, height: L.scene }]}>
        <VillageScene {...v.scene} width={L.sceneWidth} height={L.scene} onBoardPress={openBoard} />
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

      {/* 밭 띠: 장면 밖. 5칸 가로, 작물 성장 그림 + 상태 글자 */}
      <View style={[styles.field, { marginTop: L.gap }]}>
        <FieldStrip plots={v.plots} time={v.timeOfDay} height={L.field} labels={L.fieldLabels} />
      </View>

      {/* 남는 높이는 기록 버튼 위로 (버튼은 탭 바 바로 위에 붙는다) */}
      <View style={{ flex: L.scroll ? 0 : 1, minHeight: L.gap }} />

      <PrimaryButton
        label={v.recordedToday ? '오늘 기록 고치기' : '오늘 기록하기'}
        onPress={() => router.push('/record')}
        style={[styles.cta, { height: L.cta }]}
      />
    </>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]} testID={`main-layout-step-${L.step}`}>
      {L.scroll ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        <View style={styles.fill}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  fill: { flex: 1 },
  scrollContent: { paddingBottom: 8 },
  header: { paddingTop: 2, paddingHorizontal: SIDE + 4, justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.title, fontSize: 26, lineHeight: 34, color: colors.yellow },
  levelBadge: {
    backgroundColor: colors.pink,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 14,
    shadowColor: colors.pink,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  levelText: { fontFamily: fonts.title, fontSize: 20, lineHeight: 26, color: colors.line },
  scene: { alignSelf: 'center', borderRadius: radius.card, overflow: 'hidden', backgroundColor: '#141A44' },
  indices: { flexDirection: 'row', gap: 8, marginHorizontal: SIDE },
  field: { marginHorizontal: SIDE },
  cta: { marginHorizontal: SIDE },
});
