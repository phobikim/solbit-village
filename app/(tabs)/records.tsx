// 7b 기록. 월간 달력(날씨·행사) + 날짜별 기록 카드. 기록은 SQLite에서 읽는다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { broadcasts, withPrefix } from '../../src/copy/broadcasts.ko';
import {
  addMonths,
  compareYearMonth,
  daysInMonth,
  makeDayKey,
  today as getToday,
  yearMonthOf,
  type DayKey,
} from '../../src/domain/day';
import { canEditRecord, recordHeadline } from '../../src/domain/records';
import type { Condition, Weather } from '../../src/domain/types';
import { isRainy, weatherOn } from '../../src/domain/weather';
import { mockEventDays } from '../../src/mocks/tabs';
import { useRecords } from '../../src/state/records';
import { MonthCalendar } from '../../src/ui/components/MonthCalendar';
import { RecordCard } from '../../src/ui/components/RecordCard';
import { RoundButton } from '../../src/ui/components/RoundButton';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts } from '../../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function RecordsScreen() {
  const today = getToday();
  const thisMonth = yearMonthOf(today);
  const [month, setMonth] = useState(thisMonth);
  const canGoNext = compareYearMonth(month, thisMonth) < 0;

  const byDate = useRecords((s) => s.byDate);
  const loadMonth = useRecords((s) => s.loadMonth);

  useFocusEffect(
    useCallback(() => {
      loadMonth(month).catch((e) => console.warn('[records] load failed', e));
    }, [loadMonth, month]),
  );

  const { weatherByDay, days } = useMemo(() => {
    const conditionByDay: Record<DayKey, Condition> = Object.fromEntries(
      Object.values(byDate).map((r) => [r.date, r.condition]),
    );
    const weather: Record<DayKey, Weather> = {};
    const list: DayKey[] = [];
    for (let d = daysInMonth(month); d >= 1; d--) {
      const key = makeDayKey(month.year, month.month, d);
      if (!byDate[key]) continue;
      list.push(key);
      const w = weatherOn(key, conditionByDay);
      if (w) weather[key] = w;
    }
    return { weatherByDay: weather, days: list };
  }, [byDate, month]);

  // TODO(단계 4): 방송 선택은 src/domain/broadcast.ts로
  const rainyDays = Object.values(weatherByDay).filter(isRainy).length;
  const broadcast = { message: withPrefix(broadcasts.rainyMonth(rainyDays)), time: timeLabel(new Date()) };

  // TODO(단계 5): 행사는 이장네 장부(event 테이블)에서
  const eventDays = useMemo(() => new Set(mockEventDays), []);

  const monthNav = (
    <View style={styles.nav}>
      <RoundButton
        icon="prev"
        variant="card"
        size={32}
        accessibilityLabel="이전 달"
        onPress={() => setMonth((m) => addMonths(m, -1))}
      />
      <Text style={styles.month}>
        {month.year}.{String(month.month).padStart(2, '0')}
      </Text>
      <RoundButton
        icon="next"
        variant="card"
        size={32}
        disabled={!canGoNext}
        accessibilityLabel="다음 달"
        onPress={() => setMonth((m) => addMonths(m, 1))}
      />
    </View>
  );

  return (
    <Screen title="기록" broadcast={broadcast} right={monthNav}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthCalendar month={month} today={today} weatherByDay={weatherByDay} eventDays={eventDays} />
        {days.length > 0 ? (
          days.map((key) => {
            const r = byDate[key];
            return (
              <RecordCard
                key={key}
                date={key}
                condition={r.condition}
                work={r.work}
                headline={recordHeadline(r)}
                weather={weatherByDay[key] ?? null}
                onPress={
                  canEditRecord(key, today) ? () => router.push({ pathname: '/record', params: { date: key } }) : undefined
                }
              />
            );
          })
        ) : (
          <Text style={styles.empty}>이 달은 기록이 없습니다. 괜찮습니다.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  month: { fontFamily: fonts.number, fontSize: 17, minWidth: 80, textAlign: 'center', color: colors.text },
  content: { padding: 12, gap: 8, paddingBottom: 24 },
  empty: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
