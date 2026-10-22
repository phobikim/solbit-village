// 보따리 한 줄 (12c · 12d): 가고 싶은 곳(핀 · 날짜 잡기) / 다녀온 곳(체크 · 언제 · 며칠)

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { keptLabel, restCopy, tripLength } from '../../copy/rest.ko';
import { WEEKDAYS } from '../../copy/labels.ko';
import { dDayLabel, parseDayKey, weekdayOf, type DayKey } from '../../domain/day';
import { keptDays, type Place } from '../../domain/rest';
import { EventIcon } from '../characters';
import { colors, fonts } from '../theme';

const PIN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="${colors.leisure}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="${colors.textMuted}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`;

const pad = (n: number) => String(n).padStart(2, '0');
const mdDow = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${pad(month)}.${pad(day)} (${WEEKDAYS[weekdayOf(d)]})`;
};
const ym = (d: DayKey) => {
  const { year, month } = parseDayKey(d);
  return `${year}.${pad(month)}`;
};

/** 보따리 줄 누르기 · 날짜 잡기 (쉼터 · 보따리 화면) */
export function openPlace(p: Place) {
  router.push({ pathname: '/place-new', params: { id: p.id } });
}
export function schedulePlace(p: Place) {
  router.push({ pathname: '/ledger/new', params: { type: 'travel', name: p.name, placeId: p.id } });
}

type Props = {
  place: Place;
  /** '날짜 잡기'로 잡힌 여행 날짜 (아직 안 지났을 때만) */
  scheduled: DayKey | null;
  today: DayKey;
  onPress: () => void;
  onSchedule: () => void;
};

export function PlaceRow({ place, scheduled, today, onPress, onSchedule }: Props) {
  if (place.visited)
    return (
      <Pressable onPress={onPress} style={[styles.row, styles.rowVisited]}>
        <View style={styles.icon}>
          <SvgXml xml={CHECK_SVG} width={20} height={20} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.name, { color: colors.textSub }]} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={styles.sub}>
            {place.visitedDate && <Text style={styles.num}>{ym(place.visitedDate)}</Text>}
            {place.visitedDate ? ' · ' : ''}
            {tripLength(place.nights)}
          </Text>
        </View>
      </Pressable>
    );

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.icon}>{scheduled ? <EventIcon type="travel" size={26} /> : <SvgXml xml={PIN_SVG} width={22} height={22} />}</View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={styles.sub}>
          {scheduled ? (
            <>
              <Text style={styles.num}>{mdDow(scheduled)}</Text> · {restCopy.scheduled}
            </>
          ) : (
            keptLabel(keptDays(place, today))
          )}
        </Text>
      </View>
      {scheduled ? (
        <View style={styles.dday}>
          <Text style={styles.ddayText}>{dDayLabel(scheduled, today)}</Text>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={onSchedule} style={styles.schedule}>
          <Text style={styles.scheduleText}>{restCopy.schedule}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.cardSub, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowVisited: { backgroundColor: '#181F4C' },
  icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  num: { fontFamily: fonts.number },
  dday: { backgroundColor: colors.yellow, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10 },
  ddayText: { fontFamily: fonts.title, fontSize: 16, color: colors.line },
  schedule: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: colors.pink,
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#B32A6E',
  },
  scheduleText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.line },
});
