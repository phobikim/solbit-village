// 월간 달력: 날짜별 날씨 아이콘 + 행사 현수막 표시 (7b)

import { StyleSheet, Text, View } from 'react-native';

import { WEATHER_NAME, WEEKDAYS } from '../../copy/labels.ko';
import { daysBetween, monthGrid, parseDayKey, type DayKey, type YearMonth } from '../../domain/day';
import type { Weather } from '../../domain/types';
import { BannerIcon, WeatherIcon } from '../characters';
import { colors, fonts } from '../theme';

type Props = {
  month: YearMonth;
  today: DayKey;
  weatherByDay: Record<DayKey, Weather>;
  eventDays: ReadonlySet<DayKey>;
};

const LEGEND: Weather[] = ['sun', 'cloud', 'over', 'rain', 'storm'];

export function MonthCalendar({ month, today, weatherByDay, eventDays }: Props) {
  const cells = monthGrid(month);
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
        {cells.map((key, i) => {
          if (!key) return <View key={`e${i}`} style={styles.cell} />;
          const { day } = parseDayKey(key);
          const future = daysBetween(today, key) > 0;
          const isToday = key === today;
          const weather = weatherByDay[key];
          return (
            <View
              key={key}
              style={[
                styles.cell,
                !future && styles.cellPast,
                isToday && styles.cellToday,
              ]}
              accessibilityLabel={`${month.month}월 ${day}일${weather ? `, ${WEATHER_NAME[weather]}` : ''}${eventDays.has(key) ? ', 행사' : ''}`}
            >
              {eventDays.has(key) && (
                <View style={styles.banner}>
                  <BannerIcon color={colors.pink} size={15} />
                </View>
              )}
              <Text
                style={[
                  styles.dayNum,
                  i % 7 === 0 && styles.sunday,
                  future && styles.dayFuture,
                ]}
              >
                {day}
              </Text>
              <View style={styles.icon}>{weather && <WeatherIcon weather={weather} size={22} />}</View>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        {LEGEND.map((w) => (
          <View key={w} style={styles.legendItem}>
            <WeatherIcon weather={w} size={18} />
            <Text style={styles.legendText}>{WEATHER_NAME[w]}</Text>
          </View>
        ))}
        <View style={styles.legendItem}>
          <BannerIcon color={colors.pink} size={18} />
          <Text style={styles.legendText}>행사</Text>
        </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 3 },
  cell: {
    width: `${100 / 7}%`,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellPast: { backgroundColor: colors.card, borderColor: colors.cardSub },
  cellToday: { backgroundColor: colors.track, borderColor: colors.yellow, borderWidth: 2 },
  banner: { position: 'absolute', top: 1, right: 1 },
  dayNum: { fontFamily: fonts.number, fontSize: 11, lineHeight: 12, color: colors.text },
  dayFuture: { color: colors.disabled },
  icon: { width: 22, height: 22 },
  legend: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textSub },
});
