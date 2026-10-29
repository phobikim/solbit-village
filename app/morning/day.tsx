// 아침 흐름 2번째 화면 "오늘 하루 고르기" (디자인 v5 26a~c). 일하는 날 / 노는 날 중 하나를 고르고, 받을 보상(예정)을 카드에서 바로 보여 준다.
// 값은 메모리(zustand)에만 둔다 — DB 저장 없음. 기록 입력 · 코인/기력 지급은 이 화면에 두지 않는다 (지급은 저녁 기록 저장 시, 별도 작업).
// TODO([미정]): 지급은 저녁 기록 저장 시. 기력과 장작 상한 관계 확정 후 구현

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, SvgXml } from 'react-native-svg';

import {
  DAY_PICK_BROADCAST,
  DAY_SECTION,
  MORNING_LATER,
  MORNING_NEXT,
  REWARD_NOTE,
  REWARD_TABLE_OPEN,
  villageLevelChip,
} from '../../src/copy/morning.ko';
import type { DayType } from '../../src/domain/morning';
import { useMorning, useTodayDayType } from '../../src/state/morningStore';
import { useMorningVillage } from '../../src/state/villageLevel';
import { BroadcastLine } from '../../src/ui/components/BroadcastLine';
import { MorningHeader } from '../../src/ui/components/MorningHeader';
import { DayCards } from '../../src/ui/components/MorningChoices';
import { MorningScene } from '../../src/ui/components/MorningScene';
import { ICON_TROPHY } from '../../src/ui/characters/rewardIcons';
import { APP_MAX_WIDTH, MORNING_DAY_LAYOUT, morningDayLayout } from '../../src/ui/layout';
import { VillageRewardSheet } from '../../src/ui/morning/VillageRewardSheet';
import { AFTER_DAY_HREF } from '../../src/ui/navigation';
import { colors, fonts } from '../../src/ui/theme';
import { useScreenActive } from '../../src/ui/useScreenActive';
import { useVisibleHeight } from '../../src/ui/useVisibleHeight';

const M = MORNING_DAY_LAYOUT;
const pad = (n: number) => String(n).padStart(2, '0');

export default function MorningDayScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const visibleHeight = useVisibleHeight();
  const reduceMotion = useReducedMotion();
  const active = useScreenActive();

  const now = new Date();
  const village = useMorningVillage();
  const saved = useTodayDayType(now);
  const setDayType = useMorning((s) => s.setDayType);
  // 고른 값은 [다음]을 눌러야 저장된다. [나중에 할래유]로 넘어가면 저장하지 않는다.
  const [picked, setPicked] = useState<DayType | null>(saved);
  const [sheetOpen, setSheetOpen] = useState(false);

  // SafeAreaView가 위쪽 안전 영역을 처리하고, 아래쪽은 이 화면이 직접 더한다
  const L = morningDayLayout(visibleHeight, insets.top, insets.bottom);
  const sceneWidth = Math.min(windowWidth, APP_MAX_WIDTH) - 24;
  const canNext = picked !== null;

  const next = () => {
    if (picked === null) return;
    setDayType(picked);
    router.replace(AFTER_DAY_HREF);
  };
  const later = () => router.replace(AFTER_DAY_HREF);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        scrollEnabled={L.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { minHeight: visibleHeight - insets.top, paddingBottom: insets.bottom + M.bottomPad }]}
      >
        <MorningHeader step={1} />

        <BroadcastLine message={DAY_PICK_BROADCAST} time={`${pad(now.getHours())}:${pad(now.getMinutes())}`} />

        <View style={styles.scene}>
          <MorningScene width={sceneWidth} height={L.scene} dayType={picked} active={active && !sheetOpen} reduceMotion={reduceMotion} />
        </View>

        <View style={[styles.block, { marginTop: M.gapDays }]}>
          <View style={styles.labelRow}>
            <View style={styles.label}>
              <Svg width={14} height={14} viewBox="0 0 28 28" fill={colors.relation}>
                <Path d="M13 26V16h2v10z" />
                <Path d="M14 17C14 12 10 9 4 9c0 5 4 8 10 8z" />
                <Path d="M14 15c0-4.5 3.5-7.5 10-7.5 0 4.5-3.5 7.5-10 7.5z" />
              </Svg>
              <Text style={styles.labelText}>{DAY_SECTION}</Text>
            </View>
            <View style={styles.levelChip}>
              <Text style={styles.levelChipText}>{villageLevelChip(village.level)}</Text>
            </View>
          </View>
          <DayCards value={picked} onPick={setPicked} height={L.dayCard} rewards={village.rewards} />
        </View>

        <View style={[styles.rewardLink, { marginTop: M.gapReward }]}>
          <Pressable accessibilityRole="button" onPress={() => setSheetOpen(true)} hitSlop={{ top: 6, bottom: 6 }} style={styles.openTable}>
            <SvgXml xml={ICON_TROPHY} width={18} height={18} />
            <Text style={styles.openTableText}>{REWARD_TABLE_OPEN}</Text>
          </Pressable>
          <Text style={styles.note}>{REWARD_NOTE}</Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottom}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canNext }}
            disabled={!canNext}
            onPress={next}
            style={({ pressed }) => [styles.next, !canNext && styles.nextOff, pressed && canNext && styles.nextPressed]}
          >
            <Text style={[styles.nextLabel, !canNext && styles.nextLabelOff]}>{MORNING_NEXT}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={later} style={styles.later}>
            <Text style={styles.laterLabel}>{MORNING_LATER}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <VillageRewardSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} level={village.level} progress={village.progress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { flexGrow: 1 },
  scene: { marginTop: M.gapScene, marginHorizontal: 12 },
  block: { marginHorizontal: 12, gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, height: 22 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  labelText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  levelChip: { backgroundColor: colors.yellow, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  levelChipText: { fontFamily: fonts.numberBold, fontSize: 12, color: colors.line },
  rewardLink: { alignItems: 'center', gap: 2 },
  openTable: { height: 32, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  openTableText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.yellow },
  note: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  spacer: { flexGrow: 1, minHeight: M.gapButton },
  bottom: { marginHorizontal: 16, alignItems: 'center', gap: M.gapLater },
  next: {
    alignSelf: 'stretch',
    height: M.button,
    borderRadius: 28,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    // 시안: box-shadow 0 5px 0 #B32A6E (아래 단단한 진한 핑크 단색 그림자)
    borderBottomWidth: 5,
    borderBottomColor: colors.pinkShadow,
  },
  nextPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  nextOff: { backgroundColor: colors.card, borderBottomColor: '#181F4C' },
  nextLabel: { fontFamily: fonts.title, fontSize: 20, color: colors.line },
  nextLabelOff: { color: colors.textMuted },
  later: { height: M.later, minWidth: 140, alignItems: 'center', justifyContent: 'center' },
  laterLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted },
});
