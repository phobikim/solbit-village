// 쉼터 카드: 가고 싶은 곳(걸리는 시간 · 메모 · [다녀왔슈]) / 다녀온 곳(언제 · 며칠 · 소감 · n번 감 · [또 가고 싶슈])

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { PLACE_DURATION_LABEL, restCopy, tripLength, visitCountLabel } from '../../copy/rest.ko';
import { WEEKDAYS } from '../../copy/labels.ko';
import { dDayLabel, parseDayKey, weekdayOf, type DayKey } from '../../domain/day';
import type { Place } from '../../domain/rest';
import { REST_FEATURES } from '../features';
import { EventIcon } from '../characters';
import { colors, fonts } from '../theme';

const PIN_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="${colors.leisure}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/></svg>`;
const CHECK_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="${colors.textMuted}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`;

const pad = (n: number) => String(n).padStart(2, '0');
const mdDow = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${pad(month)}.${pad(day)} (${WEEKDAYS[weekdayOf(d)]})`;
};
const ymd = (d: DayKey) => {
  const { year, month, day } = parseDayKey(d);
  return `${year}.${pad(month)}.${pad(day)}`;
};

/** 카드 누르기 = 고치기 */
export function openPlace(p: Place) {
  router.push({ pathname: '/place-new', params: { id: p.id } });
}
/** [다녀왔슈] */
export function visitPlace(p: Place) {
  router.push({ pathname: '/place-new', params: { id: p.id, mode: 'visit' } });
}
/** [날짜 잡기] (꺼 둔 기능) */
export function schedulePlace(p: Place) {
  router.push({ pathname: '/ledger/new', params: { type: 'travel', name: p.name, placeId: p.id } });
}

export function WishCard({ place, scheduled, today }: { place: Place; scheduled: DayKey | null; today: DayKey }) {
  const showSchedule = REST_FEATURES.schedule;
  return (
    <Pressable onPress={() => openPlace(place)} style={styles.row}>
      <View style={styles.icon}>
        {showSchedule && scheduled ? <EventIcon type="travel" size={26} /> : <SvgXml xml={PIN_SVG} width={22} height={22} />}
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={styles.chip}>{PLACE_DURATION_LABEL[place.duration]}</Text>
        </View>
        {showSchedule && scheduled ? (
          <Text style={styles.sub}>
            <Text style={styles.num}>{mdDow(scheduled)}</Text> · {restCopy.scheduled} · {dDayLabel(scheduled, today)}
          </Text>
        ) : (
          !!place.memo && (
            <Text style={styles.sub} numberOfLines={2}>
              {place.memo}
            </Text>
          )
        )}
      </View>
      <View style={styles.buttons}>
        {showSchedule && !scheduled && (
          <Pressable accessibilityRole="button" onPress={() => schedulePlace(place)} style={[styles.btn, styles.btnSub]}>
            <Text style={[styles.btnText, { color: colors.text }]}>{restCopy.schedule}</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="button" onPress={() => visitPlace(place)} style={styles.btn}>
          <Text style={styles.btnText}>{restCopy.visitedBtn}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

export function VisitedCard({ place, count, onWishAgain }: { place: Place; count: number | undefined; onWishAgain: () => void }) {
  return (
    <Pressable onPress={() => openPlace(place)} style={[styles.row, styles.rowVisited]}>
      <View style={styles.icon}>
        <SvgXml xml={CHECK_SVG} width={20} height={20} />
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textSub }]} numberOfLines={1}>
            {place.name}
          </Text>
          {count && <Text style={[styles.chip, styles.chipCount]}>{visitCountLabel(count)}</Text>}
        </View>
        <Text style={styles.sub}>
          {place.visitedDate && <Text style={styles.num}>{ymd(place.visitedDate)}</Text>}
          {place.visitedDate ? ' · ' : ''}
          {tripLength(place.nights)}
        </Text>
        {!!place.note && (
          <Text style={styles.note} numberOfLines={2}>
            “{place.note}”
          </Text>
        )}
      </View>
      <Pressable accessibilityRole="button" onPress={onWishAgain} style={[styles.btn, styles.btnSub]}>
        <Text style={[styles.btnText, { color: colors.text }]}>{restCopy.wishAgainBtn}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.cardSub, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowVisited: { backgroundColor: '#181F4C' },
  icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  chip: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 11,
    color: colors.leisure,
    backgroundColor: colors.track,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  chipCount: { color: colors.yellow },
  sub: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  note: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 17, color: colors.textSub },
  num: { fontFamily: fonts.number },
  buttons: { gap: 6 },
  btn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: '#B32A6E',
  },
  btnSub: { backgroundColor: colors.track, borderBottomColor: '#232B60' },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.line },
});
