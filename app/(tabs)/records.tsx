// 12a · 12b 장부 (기록 탭 + 이장네 장부, 디자인 TURN 12). 월간 달력(날씨·행사) 아래
// 그날그날(날짜별 기록 카드) / 대소사(행사 · 성취)를 고른다. 기록은 SQLite에서 읽는다.

import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
import { eventDaysInMonth } from '../../src/domain/events';
import { canCreateRecord, canEditRecord, recordHeadline } from '../../src/domain/records';
import type { Condition, Weather } from '../../src/domain/types';
import { weatherOn } from '../../src/domain/weather';
import { useLedger } from '../../src/state/ledger';
import { useRecords } from '../../src/state/records';
import { LedgerEvents, openEventSheet } from '../../src/ui/components/LedgerEvents';
import { MonthCalendar } from '../../src/ui/components/MonthCalendar';
import { RecordCard } from '../../src/ui/components/RecordCard';
import { RoundButton } from '../../src/ui/components/RoundButton';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts } from '../../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

type View_ = 'days' | 'events';

export default function LedgerScreen() {
  const params = useLocalSearchParams<{ view?: string }>();
  const [view, setView] = useState<View_>(params.view === 'events' ? 'events' : 'days');
  // 게시판을 눌러 들어오면 대소사 (메인 11b)
  useEffect(() => {
    if (params.view === 'events') setView('events');
  }, [params.view]);
  const today = getToday();
  const thisMonth = yearMonthOf(today);
  const [month, setMonth] = useState(thisMonth);
  const canGoNext = compareYearMonth(month, thisMonth) < 0;

  const byDate = useRecords((s) => s.byDate);
  const loadMonth = useRecords((s) => s.loadMonth);
  const events = useLedger((s) => s.events);
  const achievements = useLedger((s) => s.achievements);
  const loaded = useLedger((s) => s.loaded);
  const loadLedger = useLedger((s) => s.load);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadMonth(month), loadLedger()]).catch((e) => console.warn('[records] load failed', e));
    }, [loadMonth, loadLedger, month]),
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

  const broadcast = { message: withPrefix(broadcasts.ledger), time: timeLabel(new Date()) };

  const eventDays = useMemo(() => eventDaysInMonth(events, month.year, month.month), [events, month]);

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
    <Screen title="장부" broadcast={broadcast} right={monthNav}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthCalendar
          month={month}
          today={today}
          weatherByDay={weatherByDay}
          eventDays={eventDays}
          isPressable={(d) => (byDate[d] ? canEditRecord(d, today) : canCreateRecord(d, today))}
          onDayPress={(d) => router.push({ pathname: '/record', params: { date: d } })}
        />
        <View style={styles.seg} accessibilityRole="tablist">
          {(['days', 'events'] as const).map((k) => (
            <Pressable
              key={k}
              accessibilityRole="tab"
              accessibilityState={{ selected: view === k }}
              onPress={() => setView(k)}
              style={[styles.segItem, view === k && styles.segOn]}
            >
              <Text style={[styles.segText, view === k && styles.segTextOn]}>{k === 'days' ? '그날그날' : '대소사'}</Text>
            </Pressable>
          ))}
        </View>
        {view === 'events' ? (
          <LedgerEvents today={today} events={events} achievements={achievements} loaded={loaded} />
        ) : days.length > 0 ? (
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
      {view === 'events' && (
        <RoundButton icon="plus" size={58} accessibilityLabel="행사 등록" onPress={() => openEventSheet()} style={styles.fab} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  month: { fontFamily: fonts.number, fontSize: 17, minWidth: 80, textAlign: 'center', color: colors.text },
  content: { padding: 12, gap: 8, paddingBottom: 96 },
  seg: { flexDirection: 'row', height: 44, borderRadius: 22, backgroundColor: colors.cardSub, padding: 4, gap: 4, marginTop: 2 },
  segItem: { flex: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.yellow },
  segText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.textSub },
  segTextOn: { color: colors.line },
  fab: { position: 'absolute', right: 20, bottom: 24 },
  empty: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
