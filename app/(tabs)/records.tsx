// 7b 기록. 단계 2: 목업 데이터로 정적 화면 (달력은 실제 날짜로 이동 가능).

import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { addMonths, compareYearMonth, today as getToday, yearMonthOf } from '../../src/domain/day';
import { mockEventDays, mockRecords, mockWeatherByDay } from '../../src/mocks/tabs';
import { mockBroadcasts } from '../../src/mocks/village';
import { MonthCalendar } from '../../src/ui/components/MonthCalendar';
import { RecordCard } from '../../src/ui/components/RecordCard';
import { RoundButton } from '../../src/ui/components/RoundButton';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts } from '../../src/ui/theme';

export default function RecordsScreen() {
  const today = getToday();
  const thisMonth = yearMonthOf(today);
  const [month, setMonth] = useState(thisMonth);
  const canGoNext = compareYearMonth(month, thisMonth) < 0;

  const eventDays = useMemo(() => new Set(mockEventDays), []);
  const records = mockRecords.filter((r) => compareYearMonth(yearMonthOf(r.date), month) === 0);

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
    <Screen title="기록" broadcast={mockBroadcasts.records} right={monthNav}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <MonthCalendar month={month} today={today} weatherByDay={mockWeatherByDay} eventDays={eventDays} />
        {records.length > 0 ? (
          records.map((r) => <RecordCard key={r.date} {...r} />)
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
