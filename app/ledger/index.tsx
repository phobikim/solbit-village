// 8b 이장네 장부: 다가오는 행사 + 지나간 일(지난 행사 · 성취). 일상·시스템 기록은 넣지 않는다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { broadcasts, withPrefix } from '../../src/copy/broadcasts.ko';
import { ACHIEVEMENT_LABEL, EVENT_TYPE_COLOR, EVENT_TYPE_LABEL, WEEKDAYS } from '../../src/copy/labels.ko';
import { dDayLabel, parseDayKey, today as getToday, weekdayOf, type DayKey } from '../../src/domain/day';
import { BOARD_MAX, pastItems, upcomingEvents } from '../../src/domain/events';
import { useLedger } from '../../src/state/ledger';
import { BannerIcon, EventIcon } from '../../src/ui/characters';
import { SubScreen } from '../../src/ui/components/form';
import { RoundButton } from '../../src/ui/components/RoundButton';
import { colors, fonts } from '../../src/ui/theme';

const pad = (n: number) => String(n).padStart(2, '0');
const mdDow = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${pad(month)}.${pad(day)} (${WEEKDAYS[weekdayOf(d)]})`;
};
const md = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${pad(month)}.${pad(day)}`;
};
const timeLabel = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function Ledger() {
  const today = getToday();
  const events = useLedger((s) => s.events);
  const achievements = useLedger((s) => s.achievements);
  const load = useLedger((s) => s.load);
  const loaded = useLedger((s) => s.loaded);

  useFocusEffect(
    useCallback(() => {
      load().catch((e) => console.warn('[ledger] load failed', e));
    }, [load]),
  );

  const upcoming = upcomingEvents(events, today);
  const past = useMemo(
    () => pastItems(events, achievements, today),
    [events, achievements, today],
  );
  const open = (id?: string) => router.push(id ? { pathname: '/ledger/new', params: { id } } : '/ledger/new');

  return (
    <SubScreen title="이장네 장부" broadcast={{ message: withPrefix(broadcasts.ledger), time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.section}>다가오는 행사</Text>
        {loaded && upcoming.length === 0 && (
          <Text style={styles.empty}>게시판에 붙은 쪽지가 없습니다. + 로 행사를 적어 두세요.</Text>
        )}
        {upcoming.map((e, i) => (
          <Pressable key={e.id} onPress={() => open(e.id)} style={[styles.card, i === 0 && styles.cardBanner]}>
            <View style={styles.icon}>
              <EventIcon type={e.type} size={30} />
            </View>
            <View style={styles.body}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {e.name}
                </Text>
                <Text style={[styles.badge, { color: EVENT_TYPE_COLOR[e.type] }]}>
                  {EVENT_TYPE_LABEL[e.type]}
                </Text>
              </View>
              <Text style={styles.date}>
                {mdDow(e.date)}
                {i === 0 ? ' · 게시판 맨 앞' : i < BOARD_MAX ? ' · 게시판' : ''}
                {e.repeatYearly ? ' · 매년' : ''}
              </Text>
            </View>
            <View style={[styles.dday, i === 0 && styles.ddayBanner]}>
              <Text style={[styles.ddayText, i === 0 && { color: colors.line }]}>{dDayLabel(e.date, today)}</Text>
            </View>
          </Pressable>
        ))}

        {past.length > 0 && <Text style={[styles.section, { marginTop: 8 }]}>지나간 일</Text>}
        {past.map((p) =>
          p.kind === 'event' ? (
            <Pressable key={`e${p.event.id}`} onPress={() => open(p.event.id)} style={styles.card}>
              <View style={styles.icon}>
                <EventIcon type={p.event.type} size={30} />
              </View>
              <View style={styles.body}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p.event.name}
                  </Text>
                  <Text style={[styles.badge, { color: EVENT_TYPE_COLOR[p.event.type] }]}>
                    {EVENT_TYPE_LABEL[p.event.type]}
                  </Text>
                </View>
              </View>
              <Text style={styles.pastDate}>{md(p.date)}</Text>
            </Pressable>
          ) : (
            <View key={`a${p.date}`} style={styles.card}>
              <View style={styles.icon}>
                <BannerIcon color={EVENT_TYPE_COLOR.achievement} size={28} />
              </View>
              <View style={styles.body}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={2}>
                    {p.text}
                  </Text>
                  <Text style={[styles.badge, { color: EVENT_TYPE_COLOR.achievement }]}>
                    {ACHIEVEMENT_LABEL}
                  </Text>
                </View>
              </View>
              <Text style={styles.pastDate}>{md(p.date)}</Text>
            </View>
          ),
        )}
      </ScrollView>
      <RoundButton icon="plus" size={58} accessibilityLabel="행사 등록" onPress={() => open()} style={styles.fab} />
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 8, paddingBottom: 96 },
  section: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, paddingLeft: 4, marginTop: 4 },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, padding: 8 },
  card: {
    backgroundColor: colors.cardSub,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardBanner: { borderColor: colors.yellow },
  icon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  badge: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 11,
    backgroundColor: colors.track,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  date: { fontFamily: fonts.number, fontSize: 12, color: colors.textSub },
  dday: { backgroundColor: colors.track, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10 },
  ddayBanner: { backgroundColor: colors.yellow },
  ddayText: { fontFamily: fonts.title, fontSize: 16, color: colors.text },
  pastDate: { fontFamily: fonts.number, fontSize: 13, color: colors.textMuted },
  fab: { position: 'absolute', right: 20, bottom: 24 },
});
