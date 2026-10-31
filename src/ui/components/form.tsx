// 입력 시트 공통: 선택 칩 · 날짜 고르기 · 뒤로 가기 헤더

import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WEEKDAYS } from '../../copy/labels.ko';
import { addMonths, monthGrid, parseDayKey, yearMonthOf, type DayKey } from '../../domain/day';
import { colors, fonts } from '../theme';
import { BroadcastLine } from './BroadcastLine';
import { RoundButton } from './RoundButton';

/** 한 줄 선택 칩 (관계 · 연락 주기 · 행사 종류 …) */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  activeColor = colors.relation,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  activeColor?: string;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.chip, on && { backgroundColor: activeColor }]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 달력에서 날짜 고르기. min 이전 · max 이후 날짜는 고를 수 없다. selectedColor: 고른 날 배경 (행사 분류 색 등) */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  selectedColor = colors.yellow,
}: {
  value: DayKey;
  onChange: (d: DayKey) => void;
  min?: DayKey;
  max?: DayKey;
  selectedColor?: string;
}) {
  const [month, setMonth] = useState(() => yearMonthOf(value));
  const cells = monthGrid(month);
  // 줄 단위로 그린다 (칸 너비를 %로 주면 7칸 합이 100%를 넘어 요일이 밀릴 수 있다)
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  return (
    <View style={styles.cal}>
      <View style={styles.calHead}>
        <RoundButton icon="prev" variant="card" size={30} accessibilityLabel="이전 달" onPress={() => setMonth((m) => addMonths(m, -1))} />
        <Text style={styles.calMonth}>
          {month.year}.{String(month.month).padStart(2, '0')}
        </Text>
        <RoundButton icon="next" variant="card" size={30} accessibilityLabel="다음 달" onPress={() => setMonth((m) => addMonths(m, 1))} />
      </View>
      <View style={styles.calRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={w} style={[styles.calDow, i === 0 && { color: colors.pinkSoft }]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {weeks.map((week, w) => (
          <View key={w} style={styles.calWeek}>
        {week.map((key, i) => {
          if (!key) return <View key={`e${w}-${i}`} style={styles.calCell} />;
          const disabled = (!!min && key < min) || (!!max && key > max);
          const on = key === value;
          return (
            <Pressable
              key={key}
              disabled={disabled}
              onPress={() => onChange(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: on, disabled }}
              style={[styles.calCell, on && { backgroundColor: selectedColor }]}
            >
              <Text style={[styles.calDay, disabled && { color: colors.disabled }, on && { color: colors.line }]}>
                {parseDayKey(key).day}
              </Text>
            </Pressable>
          );
        })}
          </View>
        ))}
      </View>
    </View>
  );
}

/** 뒤로 가기 + 제목 + 방송 라인이 있는 하위 화면 틀 (창고 · 설정). back: 쌓인 화면이 없을 때 돌아갈 곳 */
export function SubScreen({
  title,
  broadcast,
  back = '/me',
  children,
}: {
  title: string;
  back?: '/me';
  broadcast: { message: string; time: string };
  children: ReactNode;
}) {
  return (
    <SafeAreaView edges={['top']} style={styles.sub}>
      <View style={styles.subHead}>
        <RoundButton
          icon="prev"
          variant="card"
          size={36}
          accessibilityLabel="뒤로"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(back))}
        />
        <Text style={styles.subTitle}>{title}</Text>
      </View>
      <BroadcastLine {...broadcast} />
      <View style={styles.subBody}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  chipTextOn: { color: colors.line },
  cal: { backgroundColor: colors.night, borderRadius: 20, padding: 10, gap: 6 },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calMonth: { fontFamily: fonts.number, fontSize: 15, color: colors.text },
  calRow: { flexDirection: 'row' },
  calDow: { flex: 1, textAlign: 'center', fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
  calGrid: {},
  calWeek: { flexDirection: 'row' },
  calCell: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  calDay: { fontFamily: fonts.number, fontSize: 13, color: colors.text },
  sub: { flex: 1, backgroundColor: colors.night },
  subHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 12 },
  subTitle: { fontFamily: fonts.title, fontSize: 28, lineHeight: 34, color: colors.yellow },
  subBody: { flex: 1 },
});
