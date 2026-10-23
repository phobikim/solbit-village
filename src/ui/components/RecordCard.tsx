// 기록 탭의 날짜별 기록 카드. 이웃 관련 표시는 넣지 않는다 (SPEC 7장).

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { REST_DAY_LABEL, WEEKDAYS, WORK_LABEL } from '../../copy/labels.ko';
import { parseDayKey, weekdayOf, type DayKey } from '../../domain/day';
import type { Condition, Weather, WorkLevel } from '../../domain/types';
import { Soli, WeatherIcon, type SoliMood } from '../characters';
import { colors, fonts, radius, workColor } from '../theme';

type Props = {
  date: DayKey;
  condition: Condition;
  /** 쉬는 날에 일 강도를 안 적었으면 null */
  work: WorkLevel | null;
  /** 메모·성취·여가 한 줄. 없으면 "기록만 한 날" */
  headline: string | null;
  weather: Weather | null;
  /** 있으면 눌러서 고칠 수 있음 */
  onPress?: () => void;
};

const MOOD: Record<Condition, SoliMood> = { 1: 'tired', 2: 'normal', 3: 'happy' };

/** 일 강도 1~3 → 지수 색 그라데이션 위치 */
const WORK_DOT: Record<WorkLevel, string> = { 1: workColor(0), 2: workColor(50), 3: workColor(100) };

export function RecordCard({ date, condition, work, headline, weather, onPress }: Props) {
  const { day } = parseDayKey(date);
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={onPress ? '눌러서 기록 고치기' : undefined}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.date}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.dow}>{WEEKDAYS[weekdayOf(date)]}</Text>
      </View>
      <Soli mood={MOOD[condition]} size={42} />
      <View style={styles.body}>
        <Text style={[styles.note, !headline && styles.noteEmpty]}>{headline ?? '기록만 한 날'}</Text>
        <View style={styles.workRow}>
          <View style={[styles.dot, { backgroundColor: work ? WORK_DOT[work] : colors.leisure }]} />
          <Text style={styles.work}>{work ? `일 강도 ${work} · ${WORK_LABEL[work]}` : REST_DAY_LABEL}</Text>
        </View>
      </View>
      <View style={styles.weather}>{weather && <WeatherIcon weather={weather} size={26} />}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSub,
    borderRadius: radius.index,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pressed: { opacity: 0.8 },
  date: { width: 30, alignItems: 'center' },
  day: { fontFamily: fonts.number, fontSize: 19, lineHeight: 21, color: colors.text },
  dow: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
  body: { flex: 1, gap: 5 },
  note: { fontFamily: fonts.bodyHeavy, fontSize: 14, lineHeight: 19, color: colors.text },
  noteEmpty: { color: colors.textMuted },
  workRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  work: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
  weather: { width: 26, height: 26 },
});
