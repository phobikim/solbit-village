// 월간 달력 (장부 개선안): 칸 색으로 쉬는 날 / 일한 날, 칸 안 날씨 아이콘, 칸 아래 대소사 분류 색 막대.
// 여러 날 일정은 기간의 모든 날짜에 막대가 든다. 날짜를 누르면 선택 표시 (하단 리스트는 장부 화면이 그린다).
// 날씨 · 분류 안내 문구(범례)는 두지 않는다.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EVENT_TYPE_COLOR, EVENT_TYPE_LABEL, WEATHER_NAME, WEEKDAYS } from '../../copy/labels.ko';
import { daysBetween, monthGrid, parseDayKey, type DayKey, type YearMonth } from '../../domain/day';
import type { EventType } from '../../domain/events';
import type { DayType, Weather } from '../../domain/types';
import { WeatherIcon } from '../characters';
import { colors, fonts } from '../theme';

type Props = {
  month: YearMonth;
  today: DayKey;
  selected: DayKey;
  weatherByDay: Record<DayKey, Weather>;
  /** 기록한 날의 종류: 일한 날 / 쉬는 날 (칸 색) */
  dayTypeByDay: Record<DayKey, DayType>;
  /** 그날 걸친 대소사 분류들 (칸 아래 색 막대) */
  eventTypesByDay: ReadonlyMap<DayKey, readonly EventType[]>;
  onDayPress: (day: DayKey) => void;
};

/** 칸 채우기: 일한 날(노랑 기운) / 쉬는 날(보라 기운) */
const FILL: Record<DayType, string> = { work: 'rgba(255,194,60,.20)', rest: 'rgba(196,155,255,.26)' };

export function MonthCalendar({ month, today, selected, weatherByDay, dayTypeByDay, eventTypesByDay, onDayPress }: Props) {
  const cells = monthGrid(month);
  // 한 줄 7칸 (일 ~ 토). 칸 너비를 %로 주면 7칸 합이 100%를 넘어 마지막 칸이 다음 줄로 밀릴 수 있어 줄 단위로 그린다.
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text key={w} style={[styles.weekday, i === 0 && styles.sunday]}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {weeks.map((week, w) => (
          <View key={w} style={styles.week}>
            {week.map((key, col) => {
              if (!key) return <View key={`e${w}-${col}`} style={styles.cell} />;
              const { day } = parseDayKey(key);
              const future = daysBetween(today, key) > 0;
              const isToday = key === today;
              const on = key === selected;
              const weather = weatherByDay[key];
              const type = dayTypeByDay[key];
              const bars = eventTypesByDay.get(key) ?? [];
              return (
                <Pressable
                  key={key}
                  onPress={() => onDayPress(key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.cell, !future && styles.cellPast, type && { backgroundColor: FILL[type] }, isToday && styles.cellToday, on && styles.cellOn]}
                  accessibilityLabel={`${month.month}월 ${day}일${type ? (type === 'rest' ? ', 쉬는 날' : ', 일한 날') : ''}${weather ? `, ${WEATHER_NAME[weather]}` : ''}${bars.length ? `, 대소사 ${bars.map((b) => EVENT_TYPE_LABEL[b]).join(' ')}` : ''}`}
                >
                  <Text style={[styles.dayNum, col === 0 && styles.sunday, future && styles.dayFuture, isToday && styles.dayToday]}>{day}</Text>
                  <View style={styles.icon}>{weather && <WeatherIcon weather={weather} size={20} />}</View>
                  {bars.length > 0 && (
                    <View style={styles.bars}>
                      {bars.slice(0, 3).map((b) => (
                        <View key={b} style={[styles.bar, { backgroundColor: EVENT_TYPE_COLOR[b] }]} />
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSub,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 6,
  },
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.bodyHeavy,
    fontSize: 11,
    color: colors.textMuted,
  },
  sunday: { color: colors.pinkSoft },
  grid: { gap: 3 },
  week: { flexDirection: 'row', gap: 2 },
  cell: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 3,
    gap: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellPast: { backgroundColor: colors.card },
  cellToday: { borderColor: colors.yellow },
  cellOn: { borderColor: '#FFFFFF', borderWidth: 2 },
  dayNum: { fontFamily: fonts.number, fontSize: 11, lineHeight: 12, color: colors.text },
  dayFuture: { color: colors.disabled },
  dayToday: { color: colors.yellow, fontFamily: fonts.numberBold },
  icon: { width: 20, height: 20 },
  bars: { position: 'absolute', left: 3, right: 3, bottom: 3, flexDirection: 'row', gap: 2 },
  bar: { flex: 1, height: 4, borderRadius: 2 },
});
