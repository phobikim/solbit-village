// 아침 흐름 2번째 화면 "오늘 하루 고르기" (디자인 v4 25b~25e). 값은 메모리(zustand)에만 둔다 — DB 저장 없음.
// 기록 입력 · 레벨 · 수치 · 월급 금액은 이 화면에 두지 않는다.

import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import {
  CONDITION_SECTION,
  DAY_PICK_BROADCAST,
  DAY_SECTION,
  MORNING_LATER,
  MORNING_NEXT,
  MORNING_STEP_LABEL,
  MORNING_TITLE,
} from '../../src/copy/morning.ko';
import { dayPickBroadcast } from '../../src/domain/morning';
import { useMorning } from '../../src/state/morningStore';
import { BroadcastLine } from '../../src/ui/components/BroadcastLine';
import { ConditionCards, DayCards } from '../../src/ui/components/MorningChoices';
import { MorningScene } from '../../src/ui/components/MorningScene';
import { APP_MAX_WIDTH, MORNING_DAY_LAYOUT, morningDayLayout } from '../../src/ui/layout';
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

  const dayType = useMorning((s) => s.dayType);
  const condition = useMorning((s) => s.condition);
  const setDayType = useMorning((s) => s.setDayType);
  const setCondition = useMorning((s) => s.setCondition);

  // SafeAreaView가 위쪽 안전 영역을 처리하고, 아래쪽은 이 화면이 직접 더한다
  const L = morningDayLayout(visibleHeight, insets.top, insets.bottom);
  const sceneWidth = Math.min(windowWidth, APP_MAX_WIDTH) - 24;
  const now = new Date();
  const canNext = dayType !== null;
  const go = () => router.replace(AFTER_DAY_HREF);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        scrollEnabled={L.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { minHeight: visibleHeight - insets.top, paddingBottom: insets.bottom + M.bottomPad }]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{MORNING_TITLE}</Text>
          <Steps />
        </View>

        <BroadcastLine
          message={DAY_PICK_BROADCAST[dayPickBroadcast(condition)]}
          time={`${pad(now.getHours())}:${pad(now.getMinutes())}`}
        />

        <View style={styles.scene}>
          <MorningScene width={sceneWidth} height={L.scene} dayType={dayType} condition={condition} active={active} reduceMotion={reduceMotion} />
        </View>

        <View style={[styles.block, { marginTop: M.gapDays }]}>
          <SectionLabel text={DAY_SECTION} />
          <DayCards value={dayType} onPick={setDayType} height={L.dayCard} />
        </View>
        <View style={[styles.block, { marginTop: M.gapConds }]}>
          <SectionLabel text={CONDITION_SECTION} />
          <ConditionCards value={condition} onPick={setCondition} height={L.condCard} />
        </View>

        <View style={styles.spacer} />

        <View style={styles.bottom}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canNext }}
            disabled={!canNext}
            onPress={go}
            style={({ pressed }) => [styles.next, !canNext && styles.nextOff, pressed && canNext && styles.nextPressed]}
          >
            <Text style={[styles.nextLabel, !canNext && styles.nextLabelOff]}>{MORNING_NEXT}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={go} style={styles.later}>
            <Text style={styles.laterLabel}>{MORNING_LATER}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.label}>
      <Svg width={14} height={14} viewBox="0 0 28 28" fill={colors.relation}>
        <Path d="M13 26V16h2v10z" />
        <Path d="M14 17C14 12 10 9 4 9c0 5 4 8 10 8z" />
        <Path d="M14 15c0-4.5 3.5-7.5 10-7.5 0 4.5-3.5 7.5-10 7.5z" />
      </Svg>
      <Text style={styles.labelText}>{text}</Text>
    </View>
  );
}

/** 발자국 3칸: 지금 1번째(연두로 채움) · 2번째(빈 칸) · 마지막은 핑크 깃발 */
function Steps() {
  return (
    <View style={styles.steps} accessible accessibilityLabel={MORNING_STEP_LABEL}>
      <View style={[styles.dot, { backgroundColor: colors.relation }]}>
        <Foot color={colors.line} />
      </View>
      <Dashes />
      <View style={[styles.dot, styles.dotOff]}>
        <Foot color={colors.tabInactive} />
      </View>
      <Dashes />
      <Svg width={24} height={30} viewBox="0 0 26 32">
        <Rect x={3} y={2} width={2.6} height={29} rx={1.3} fill="#FFFFFF" />
        <Path d="M5.6 3h17l-4 5 4 5h-17z" fill={colors.pink} />
      </Svg>
    </View>
  );
}

function Foot({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
      <Ellipse cx={8} cy={15} rx={3} ry={4.5} />
      <Ellipse cx={16} cy={9} rx={3} ry={4.5} />
    </Svg>
  );
}

function Dashes() {
  return (
    <Svg width={22} height={4} viewBox="0 0 22 4">
      <Path d="M2 2H20" stroke={colors.disabled} strokeWidth={3} strokeDasharray="1 6" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { flexGrow: 1 },
  header: { paddingTop: 2, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.title, fontSize: 28, lineHeight: 34, color: colors.yellow },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dotOff: { backgroundColor: colors.night, borderWidth: 2, borderColor: colors.disabled },
  scene: { marginTop: M.gapScene, marginHorizontal: 12 },
  block: { marginHorizontal: 12, gap: 8 },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, height: 22 },
  labelText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
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
