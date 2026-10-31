// 기간 고르기 달력 (행사 등록 시트): 날짜를 시작일 → 종료일 순서로 누른다. 규칙은 domain/events.ts pickRange.
// 시작일과 종료일은 색 칸, 그 사이 날짜는 연한 띠로 이어 보인다.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { WEEKDAYS } from '../../copy/labels.ko';
import { addMonths, monthGrid, parseDayKey, yearMonthOf, type DayKey } from '../../domain/day';
import type { RangeSelection } from '../../domain/events';
import { colors, fonts } from '../theme';
import { RoundButton } from './RoundButton';

type Props = {
  value: RangeSelection;
  onPick: (day: DayKey) => void;
  min?: DayKey;
  /** 선택 색 (분류 색) */
  color?: string;
};

export function RangePicker({ value, onPick, min, color = colors.yellow }: Props) {
  const [month, setMonth] = useState(() => yearMonthOf(value.start));
  const cells = monthGrid(month);
  // 줄 단위로 그린다 (칸 너비를 %로 주면 7칸 합이 100%를 넘어 요일이 밀릴 수 있다)
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const last = value.end ?? value.start;
  return (
    <View style={styles.cal}>
      <View style={styles.head}>
        <RoundButton icon="prev" variant="card" size={30} accessibilityLabel="이전 달" onPress={() => setMonth((m) => addMonths(m, -1))} />
        <Text style={styles.monthText}>
          {month.year}.{String(month.month).padStart(2, '0')}
        </Text>
        <RoundButton icon="next" variant="card" size={30} accessibilityLabel="다음 달" onPress={() => setMonth((m) => addMonths(m, 1))} />
      </View>
      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text key={w} style={[styles.dow, i === 0 && { color: colors.pinkSoft }]}>
            {w}
          </Text>
        ))}
      </View>
      {weeks.map((week, w) => (
        <View key={w} style={styles.row}>
          {week.map((key, i) => {
            if (!key) return <View key={`e${w}-${i}`} style={styles.cell} />;
            const disabled = !!min && key < min;
            const edge = key === value.start || key === last;
            const between = !edge && key > value.start && key < last;
            return (
              <Pressable
                key={key}
                disabled={disabled}
                onPress={() => onPick(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: edge || between, disabled }}
                style={[styles.cell, between && { backgroundColor: `${color}44` }, edge && { backgroundColor: color }]}
              >
                <Text style={[styles.day, disabled && { color: colors.disabled }, edge && { color: colors.line }]}>{parseDayKey(key).day}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cal: { backgroundColor: colors.night, borderRadius: 20, padding: 10, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthText: { fontFamily: fonts.number, fontSize: 15, color: colors.text },
  row: { flexDirection: 'row' },
  dow: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
  cell: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  day: { fontFamily: fonts.number, fontSize: 13, color: colors.text },
});
