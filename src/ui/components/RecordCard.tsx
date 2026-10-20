// 기록 탭의 날짜별 기록 카드. 이웃 관련 표시는 넣지 않는다 (SPEC 7장).

import { StyleSheet, Text, View } from 'react-native';

import { WEEKDAYS, WORK_LABEL } from '../../copy/labels.ko';
import { parseDayKey, weekdayOf, type DayKey } from '../../domain/day';
import type { Weather } from '../../domain/types';
import { Soli, WeatherIcon, type SoliMood } from '../characters';
import { colors, fonts, radius, workColor } from '../theme';

type Props = {
  date: DayKey;
  mood: SoliMood;
  work: 1 | 2 | 3;
  note: string;
  weather: Weather;
};

/** 일 강도 1~3 → 지수 색 그라데이션 위치 */
const WORK_DOT = { 1: workColor(0), 2: workColor(50), 3: workColor(100) } as const;

export function RecordCard({ date, mood, work, note, weather }: Props) {
  const { day } = parseDayKey(date);
  return (
    <View style={styles.card}>
      <View style={styles.date}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.dow}>{WEEKDAYS[weekdayOf(date)]}</Text>
      </View>
      <Soli mood={mood} size={42} />
      <View style={styles.body}>
        <Text style={styles.note}>{note}</Text>
        <View style={styles.workRow}>
          <View style={[styles.dot, { backgroundColor: WORK_DOT[work] }]} />
          <Text style={styles.work}>
            일 강도 {work} · {WORK_LABEL[work]}
          </Text>
        </View>
      </View>
      <WeatherIcon weather={weather} size={26} />
    </View>
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
  date: { width: 30, alignItems: 'center' },
  day: { fontFamily: fonts.number, fontSize: 19, lineHeight: 21, color: colors.text },
  dow: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
  body: { flex: 1, gap: 5 },
  note: { fontFamily: fonts.bodyHeavy, fontSize: 14, lineHeight: 19, color: colors.text },
  workRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  work: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
});
