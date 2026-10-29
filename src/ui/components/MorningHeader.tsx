// 아침 흐름 화면 공용 헤더: "아침 준비" + 발자국 3칸(하루 · 복장 · 마을, 마지막은 핑크 깃발). 지금 단계가 연두로 채워진다.

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

import { MORNING_STEP_LABEL, MORNING_TITLE } from '../../copy/morning.ko';
import { colors, fonts } from '../theme';

export type MorningStep = 1 | 2;

/** 지난 단계 칸의 바탕 (시안 26) */
const DONE_BG = '#2B3370';

export function MorningHeader({ step }: { step: MorningStep }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{MORNING_TITLE}</Text>
      <View style={styles.steps} accessible accessibilityLabel={MORNING_STEP_LABEL[step]}>
        <Dot state={step === 1 ? 'now' : 'done'} />
        <Dashes color={step === 1 ? colors.disabled : colors.relation} />
        <Dot state={step === 1 ? 'next' : 'now'} />
        <Dashes color={colors.disabled} />
        <Svg width={24} height={30} viewBox="0 0 26 32">
          <Rect x={3} y={2} width={2.6} height={29} rx={1.3} fill="#FFFFFF" />
          <Path d="M5.6 3h17l-4 5 4 5h-17z" fill={colors.pink} />
        </Svg>
      </View>
    </View>
  );
}

function Dot({ state }: { state: 'done' | 'now' | 'next' }) {
  const foot = state === 'done' ? colors.relation : state === 'now' ? colors.line : colors.tabInactive;
  return (
    <View style={[styles.dot, state === 'done' && styles.dotDone, state === 'now' && styles.dotNow, state === 'next' && styles.dotNext]}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill={foot}>
        <Ellipse cx={8} cy={15} rx={3} ry={4.5} />
        <Ellipse cx={16} cy={9} rx={3} ry={4.5} />
      </Svg>
    </View>
  );
}

function Dashes({ color }: { color: string }) {
  return (
    <Svg width={22} height={4} viewBox="0 0 22 4">
      <Path d="M2 2H20" stroke={color} strokeWidth={3} strokeDasharray="1 6" strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 2, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.title, fontSize: 28, lineHeight: 34, color: colors.yellow },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: DONE_BG },
  dotNow: { backgroundColor: colors.relation },
  dotNext: { backgroundColor: colors.night, borderWidth: 2, borderColor: colors.disabled },
});
