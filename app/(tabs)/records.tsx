// 12a · 12b 장부 (기록 탭 + 이장네 장부, 디자인 TURN 12 + 장부 개선안). 월간 달력(쉬는 날 · 일한 날 칸 색, 날씨, 대소사 색 막대) 아래
// 그날그날(고른 날의 대소사 → 기록) / 대소사(다가오는 행사)를 고른다. 앱을 열면 오늘이 골라져 있다. 기록은 SQLite에서 읽는다.

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
import { eventsOnDay, eventTypesByDay, LEDGER_MONTHS_AHEAD } from '../../src/domain/events';
import { canCreateRecord, canEditRecord, recordHeadline } from '../../src/domain/records';
import type { Condition, DayType, Weather } from '../../src/domain/types';
import { weatherOn } from '../../src/domain/weather';
import { useLedger } from '../../src/state/ledger';
import { useRecords } from '../../src/state/records';
import { DELETE_EVENT_LINE, deleteEventTitle } from '../../src/copy/tidy.ko';
import { EVENT_TYPE_LABEL } from '../../src/copy/labels.ko';
import type { VillageEvent } from '../../src/domain/events';
import { EventIcon } from '../../src/ui/characters';
import { DeleteSheet } from '../../src/ui/components/DeleteSheet';
import { EventCard } from '../../src/ui/components/EventCard';
import { LedgerEvents, openEventSheet } from '../../src/ui/components/LedgerEvents';
import { MonthCalendar } from '../../src/ui/components/MonthCalendar';
import { RecordCard } from '../../src/ui/components/RecordCard';
import { RoundButton } from '../../src/ui/components/RoundButton';
import { Screen } from '../../src/ui/components/Screen';
import { SegTabs } from '../../src/ui/components/SegTabs';
import { colors, fonts } from '../../src/ui/theme';

const dayLabel = (d: DayKey) => `${Number(d.slice(5, 7))}월 ${Number(d.slice(8, 10))}일`;
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
  const [selected, setSelected] = useState<DayKey>(today);
  const canGoNext = compareYearMonth(month, addMonths(thisMonth, LEDGER_MONTHS_AHEAD)) < 0;

  /** 달을 옮기면: 현재 달이면 오늘, 다른 달이면 그 달 1일이 자동으로 골라진다 */
  const goMonth = (m: typeof month) => {
    setMonth(m);
    setSelected(compareYearMonth(m, thisMonth) === 0 ? today : makeDayKey(m.year, m.month, 1));
  };

  const byDate = useRecords((s) => s.byDate);
  const loadMonth = useRecords((s) => s.loadMonth);
  const events = useLedger((s) => s.events);
  const loaded = useLedger((s) => s.loaded);
  const loadLedger = useLedger((s) => s.load);
  const removeEvent = useLedger((s) => s.remove);
  const [tidy, setTidy] = useState(false);
  const [deleting, setDeleting] = useState<VillageEvent | null>(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadMonth(month), loadLedger()]).catch((e) => console.warn('[records] load failed', e));
    }, [loadMonth, loadLedger, month]),
  );

  const { weatherByDay, dayTypeByDay } = useMemo(() => {
    const conditionByDay: Record<DayKey, Condition> = Object.fromEntries(
      Object.values(byDate).map((r) => [r.date, r.condition]),
    );
    const weather: Record<DayKey, Weather> = {};
    const types: Record<DayKey, DayType> = {};
    for (let d = daysInMonth(month); d >= 1; d--) {
      const key = makeDayKey(month.year, month.month, d);
      if (!byDate[key]) continue;
      types[key] = byDate[key].dayType;
      const w = weatherOn(key, conditionByDay);
      if (w) weather[key] = w;
    }
    return { weatherByDay: weather, dayTypeByDay: types };
  }, [byDate, month]);

  const broadcast = { message: withPrefix(broadcasts.ledger), time: timeLabel(new Date()) };

  const eventTypes = useMemo(() => eventTypesByDay(events, month.year, month.month), [events, month]);
  const dayEvents = useMemo(() => eventsOnDay(events, selected), [events, selected]);
  const dayRecord = byDate[selected];

  const monthNav = (
    <View style={styles.nav}>
      <RoundButton
        icon="prev"
        variant="card"
        size={32}
        accessibilityLabel="이전 달"
        onPress={() => goMonth(addMonths(month, -1))}
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
        onPress={() => goMonth(addMonths(month, 1))}
      />
    </View>
  );

  return (
    <Screen title="장부" broadcast={broadcast} right={monthNav}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthCalendar
          month={month}
          today={today}
          selected={selected}
          weatherByDay={weatherByDay}
          dayTypeByDay={dayTypeByDay}
          eventTypesByDay={eventTypes}
          onDayPress={setSelected}
        />
        <SegTabs
          items={[
            { key: 'days', label: '그날그날' },
            { key: 'events', label: '대소사' },
          ]}
          value={view}
          onChange={setView}
        />
        {view === 'events' ? (
          <LedgerEvents
            today={today}
            events={events}
            loaded={loaded}
            tidy={tidy && events.length > 0}
            onToggleTidy={() => setTidy(!(tidy && events.length > 0))}
            onDelete={setDeleting}
          />
        ) : (
          <View style={styles.dayList}>
            <Text style={styles.dayHead}>{dayLabel(selected)}</Text>
            {/* 대소사와 기록이 둘 다 있으면 대소사, 기록 순서로 모두 보여 준다 */}
            {dayEvents.map((e) => (
              <EventCard key={e.id} event={e} today={today} onPress={() => openEventSheet(e.id)} />
            ))}
            {dayRecord && (
              <RecordCard
                date={selected}
                condition={dayRecord.condition}
                work={dayRecord.work}
                headline={recordHeadline(dayRecord)}
                weather={weatherByDay[selected] ?? null}
                onPress={canEditRecord(selected, today) ? () => router.push({ pathname: '/record', params: { date: selected } }) : undefined}
              />
            )}
            {dayEvents.length === 0 && !dayRecord && (
              <View style={styles.emptyBox}>
                <Text style={styles.empty}>이 날은 기록도 대소사도 없습니다. 괜찮습니다.</Text>
                {canCreateRecord(selected, today) && (
                  <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/record', params: { date: selected } })} style={styles.recordBtn}>
                    <Text style={styles.recordBtnText}>이 날 기록하기</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
      <DeleteSheet
        visible={!!deleting}
        art={deleting && <EventIcon type={deleting.type} size={30} />}
        title={deleting ? deleteEventTitle(deleting.name) : ''}
        sub={deleting ? `${EVENT_TYPE_LABEL[deleting.type]} · ${deleting.date.slice(5).replace('-', '.')}` : ''}
        line={DELETE_EVENT_LINE}
        onKeep={() => setDeleting(null)}
        onDelete={async () => {
          if (!deleting) return;
          await removeEvent(deleting.id);
          setDeleting(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  month: { fontFamily: fonts.number, fontSize: 17, minWidth: 80, textAlign: 'center', color: colors.text },
  content: { padding: 12, gap: 8, paddingBottom: 24 },
  dayList: { gap: 8 },
  dayHead: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, paddingLeft: 4, marginTop: 4 },
  emptyBox: { alignItems: 'center', gap: 12, marginTop: 16 },
  empty: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  recordBtn: { height: 38, paddingHorizontal: 18, borderRadius: 19, backgroundColor: colors.cardSub, justifyContent: 'center', borderWidth: 2, borderColor: '#333C7A' },
  recordBtnText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
});
