// 7a 마을 (메인) — 디자인 TURN 30 A안. 마을 장면이 상태바 뒤 화면 맨 위까지 전체를 채우고,
// 그 위에 반투명 HUD(마을 이름 · Lv · 경험치 / 지갑 알약)와 방송띠가 얹힌다. 아래에는 "오늘 기록하기"와 탭 바가 떠 있다.
// 지수 카드 · 게시판 · 놀러 온 이웃 · 집 · 냇가 · 밭 띠 · 날씨 5단계 표현은 이번 화면에서 빠졌다 (src/ui/features.ts MAIN_SCENE에 기록, 코드 · 도메인은 그대로).
// 솔이를 누르면 솔이 옷장이 열린다. 기록 입력은 "오늘 기록하기" 시트 한 곳뿐이다 (규칙 5) — 밭은 누를 수 없다.

import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { useWallet } from '../../src/state/wallet';
import { HangerIcon } from '../../src/ui/components/HangerIcon';
import { MainBroadcast } from '../../src/ui/components/MainBroadcast';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { WalletPill } from '../../src/ui/components/WalletPill';
import { MAIN_HUD, SOLI_BADGE_SIZE, soliHit, tabBarSpace } from '../../src/ui/mainScene';
import { VillageBackdrop } from '../../src/ui/scene/VillageBackdrop';
import { colors, fonts } from '../../src/ui/theme';
import { useScreenActive } from '../../src/ui/useScreenActive';
import { useVisibleHeight } from '../../src/ui/useVisibleHeight';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const fmt = (n: number) => n.toLocaleString('en-US');

const openCloset = () => router.push('/closet');

export default function VillageScreen() {
  const today = getToday();
  const loadRange = useRecords((s) => s.loadRange);
  const loadFarm = useFarm((s) => s.load);
  const loadNeighbors = useNeighbors((s) => s.load);
  const loadLedger = useLedger((s) => s.load);
  const loadSkins = useSkins((s) => s.load);
  const loadPlaces = usePlaces((s) => s.load);
  const loadRestLogs = useRestLogs((s) => s.load);
  const loadWallet = useWallet((s) => s.load);
  const [now, setNow] = useState(() => new Date());
  const v = useVillageView(today, now);
  const active = useScreenActive();

  // 장면은 화면(상태바 뒤 포함) 전체. 웹은 보이는 높이를 쓴다
  const { width: windowWidth } = useWindowDimensions();
  const height = useVisibleHeight();
  const width = Math.min(windowWidth, 430);
  const insets = useSafeAreaInsets();
  const hit = soliHit(width, height);

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      // 그날 처음 열면 밤사이 마을 소식부터
      needsMorningNews(today)
        .then((show) => show && router.push('/morning-news'))
        .catch((e) => console.warn('[news] check failed', e));
      const { from, to } = villageRange(today);
      Promise.all([loadRange(from, to), loadFarm(), loadNeighbors(), loadLedger(), loadSkins(), loadPlaces(), loadRestLogs(), loadWallet()]).catch((e) =>
        console.warn('[village] load failed', e),
      );
    }, [today, loadRange, loadFarm, loadNeighbors, loadLedger, loadSkins, loadPlaces, loadRestLogs, loadWallet]),
  );

  const day = v.timeOfDay === 'day';
  const pct = v.level.needed > 0 ? Math.min(100, Math.max(0, (v.level.into / v.level.needed) * 100)) : 0;

  return (
    <View style={styles.root} testID="main-scene">
      {active && <StatusBar style={day ? 'dark' : 'light'} />}
      <VillageBackdrop
        variant={day ? 'day' : 'base'}
        width={width}
        height={height}
        plots={v.plots}
        soliMood={v.scene.soliMood}
        soliSkin={v.scene.soliSkin ?? null}
        active={active}
        lift={insets.bottom}
      />

      {/* 솔이를 누르면 솔이 옷장. 영역은 시안 hL/hB/hW/hH 계산 */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="솔이 · 옷장 열기"
        onPress={openCloset}
        style={{ position: 'absolute', left: hit.left, bottom: hit.bottom + insets.bottom, width: hit.width, height: hit.height }}
      >
        <View style={[styles.badge, { left: hit.badgeLeft, top: hit.badgeTop }]}>
          <HangerIcon size={15} color="#FFFFFF" />
        </View>
      </Pressable>

      <View style={[styles.top, { paddingTop: insets.top + MAIN_HUD.top }]} pointerEvents="box-none">
        <View style={styles.hudRow} pointerEvents="box-none">
          <View style={styles.hud}>
            <View style={styles.hudTitleRow}>
              <Text style={styles.hudTitle} numberOfLines={1}>
                {VILLAGE_NAME}
              </Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv.{v.level.level}</Text>
              </View>
            </View>
            <View style={styles.hudBarRow}>
              <View style={styles.barTrack} accessibilityLabel={`마을 경험치 ${v.level.into} / ${v.level.needed}`}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.hudXp}>
                {fmt(v.level.into)} / {fmt(v.level.needed)}
              </Text>
            </View>
          </View>
          {/* TODO(route: 마을 행사): 흥 칸은 마을 행사 화면이 생기면 거기로 보낸다. 지금은 누르지 않는다 (onHeungPress 없음) */}
          <WalletPill variant="hud" onCoinPress={openCloset} />
        </View>

        <MainBroadcast message={v.broadcast} time={timeLabel(now)} />
      </View>

      <View style={[styles.bottom, { bottom: tabBarSpace(insets.bottom) }]} pointerEvents="box-none">
        <PrimaryButton label={v.recordedToday ? '오늘 기록 고치기' : '오늘 기록하기'} onPress={() => router.push('/record')} style={styles.cta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#141A44', overflow: 'hidden' },
  top: { position: 'absolute', left: 0, right: 0, top: 0 },
  hudRow: { paddingHorizontal: MAIN_HUD.side, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  hud: {
    flexShrink: 1,
    minWidth: 0,
    paddingTop: 7,
    paddingHorizontal: 11,
    paddingBottom: 9,
    borderRadius: 18,
    backgroundColor: 'rgba(30,37,88,0.8)',
    borderWidth: 2.5,
    borderColor: colors.line,
    gap: 6,
  },
  hudTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  hudTitle: { fontFamily: fonts.title, fontSize: 19, lineHeight: 21, color: colors.yellow, flexShrink: 1 },
  levelBadge: { backgroundColor: colors.pink, borderRadius: 11, paddingVertical: 2, paddingHorizontal: 9 },
  levelText: { fontFamily: fonts.title, fontSize: 14, lineHeight: 18, color: colors.line },
  hudBarRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  barTrack: { width: 78, height: 10, borderRadius: 5, backgroundColor: colors.night, overflow: 'hidden' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5, backgroundColor: colors.yellow },
  hudXp: { fontFamily: fonts.numberBold, fontSize: 11, color: colors.textSub },
  badge: {
    position: 'absolute',
    width: SOLI_BADGE_SIZE,
    height: SOLI_BADGE_SIZE,
    borderRadius: SOLI_BADGE_SIZE / 2,
    backgroundColor: 'rgba(30,37,88,0.86)',
    borderWidth: 2.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { position: 'absolute', left: 0, right: 0 },
  cta: { marginHorizontal: MAIN_HUD.cta.side, height: MAIN_HUD.cta.height },
});
