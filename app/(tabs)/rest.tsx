// 12c · 12d 쉼터: 쉼 지수 · 지침 신호 · 오늘의 쉼 제안 · 보따리 · 1년 전 오늘.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { withPrefix } from '../../src/copy/broadcasts.ko';
import { PLACE_DURATION_LABEL, REST_BROADCAST, restCopy, yearAgoLine } from '../../src/copy/rest.ko';
import { lastLeisureDay } from '../../src/data/records';
import { parseDayKey, today as getToday, type DayKey } from '../../src/domain/day';
import { scheduledDate, sortPlaces } from '../../src/domain/rest';
import { useLedger } from '../../src/state/ledger';
import { usePlaces } from '../../src/state/places';
import { useRecords } from '../../src/state/records';
import { restRange, useRestView } from '../../src/state/restView';
import { Ijang } from '../../src/ui/characters';
import { indexIconSvg } from '../../src/ui/characters/icons';
import { openPlace, PlaceRow, schedulePlace } from '../../src/ui/components/PlaceRow';
import { Screen } from '../../src/ui/components/Screen';
import { colors, fonts } from '../../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const dotted = (d: DayKey) => {
  const { year, month, day } = parseDayKey(d);
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
};
/** 쉼터 첫 화면에 보이는 보따리 줄 수 */
const BUNDLE_PREVIEW = 3;

export default function RestScreen() {
  const today = getToday();
  const [tab, setTab] = useState<'wish' | 'visited'>('wish');
  const [lastLeisure, setLastLeisure] = useState<DayKey | null>(null);
  const byDate = useRecords((s) => s.byDate);
  const loadRange = useRecords((s) => s.loadRange);
  const places = usePlaces((s) => s.places);
  const loadPlaces = usePlaces((s) => s.load);
  const events = useLedger((s) => s.events);
  const loadLedger = useLedger((s) => s.load);

  useFocusEffect(
    useCallback(() => {
      const { from, to } = restRange(today);
      Promise.all([loadRange(from, to), loadPlaces(), loadLedger(), lastLeisureDay(today).then(setLastLeisure)]).catch((e) =>
        console.warn('[rest] load failed', e),
      );
    }, [today, loadRange, loadPlaces, loadLedger]),
  );

  const v = useRestView(byDate, places, lastLeisure, today);
  const wish = sortPlaces(places, false);
  const visited = sortPlaces(places, true);
  const list = (tab === 'wish' ? wish : visited).slice(0, BUNDLE_PREVIEW);

  return (
    <Screen title="쉼터" broadcast={{ message: withPrefix(REST_BROADCAST), time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.restHead}>
            <Text style={styles.cardTitle}>쉼 지수</Text>
            <View style={styles.restValue}>
              <Text style={styles.restNum}>{v.rest ?? '-'}</Text>
              <Text style={styles.restLabel}>{v.restLabel}</Text>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${v.rest ?? 0}%` }]} />
          </View>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>마지막 쉼</Text>
              <Text style={styles.statValue}>{v.lastRest}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>이번 주 쉰 날</Text>
              <Text style={styles.statValue}>{v.weekDays}일</Text>
            </View>
          </View>
        </View>

        {v.signal && (
          <View style={styles.signal}>
            <View style={styles.signalHead}>
              <View style={styles.signalDot} />
              <Text style={styles.signalTitle}>{restCopy.signalTitle}</Text>
              <Text style={styles.signalSub}>{restCopy.signalSub}</Text>
            </View>
            <View style={styles.signalCells}>
              {(
                [
                  ['work', '일', v.signal.work],
                  ['leisure', '쉼', v.signal.rest],
                  ['health', '건강', v.signal.health],
                ] as const
              ).map(([k, label, value]) => (
                <View key={k} style={styles.signalCell}>
                  <View style={styles.signalIcon}>
                    <SvgXml xml={indexIconSvg(k, colors.leisure, '#2E3775')} width={18} height={18} />
                  </View>
                  <Text style={styles.signalLabel}>{label}</Text>
                  <Text style={styles.signalValue}>{value}</Text>
                </View>
              ))}
            </View>
            <View style={styles.bubbleRow}>
              <Ijang mood="base" size={46} />
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>{v.signal.line}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{restCopy.suggestTitle}</Text>
          {v.suggestions.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggests}>
              {v.suggestions.map((p, i) => (
                <Pressable key={p.id} onPress={() => openPlace(p)} style={[styles.suggest, { backgroundColor: SUGGEST_BG[i] }]}>
                  <Text style={styles.suggestChip}>{PLACE_DURATION_LABEL[p.duration]}</Text>
                  <Text style={styles.suggestName} numberOfLines={2}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.empty}>{restCopy.suggestEmpty}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.bundleHead}>
            <Text style={styles.sectionTitle}>{restCopy.bundleTitle}</Text>
            <Text style={styles.sectionTitle} onPress={() => router.push('/bundle')} accessibilityRole="link">
              {restCopy.seeAll}
            </Text>
          </View>
          <View style={styles.chips}>
            {(['wish', 'visited'] as const).map((k) => (
              <Pressable key={k} onPress={() => setTab(k)} style={[styles.chip, tab === k && styles.chipOn]}>
                <Text style={[styles.chipText, tab === k && styles.chipTextOn]}>
                  {k === 'wish' ? `${restCopy.wish} ${wish.length}` : `${restCopy.visited} ${visited.length}`}
                </Text>
              </Pressable>
            ))}
          </View>
          {list.length ? (
            list.map((p) => (
              <PlaceRow
                key={p.id}
                place={p}
                scheduled={scheduledDate(p, events, today)}
                today={today}
                onPress={() => openPlace(p)}
                onSchedule={() => schedulePlace(p)}
              />
            ))
          ) : (
            <Text style={styles.empty}>{tab === 'wish' ? restCopy.wishEmpty : restCopy.visitedEmpty}</Text>
          )}
        </View>

        {v.yearAgo && (
          <View style={styles.yearAgo}>
            <View style={styles.yearAgoFace}>
              <Ijang mood="base" size={44} />
            </View>
            <View style={styles.body}>
              <Text style={styles.yearAgoDate}>
                {restCopy.yearAgoTitle} · {dotted(v.yearAgo.date)}
              </Text>
              <Text style={styles.yearAgoText}>{yearAgoLine(v.yearAgo.place.name)}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const SUGGEST_BG = ['#2A2F6E', '#262B66', '#22285E'];

const styles = StyleSheet.create({
  content: { padding: 12, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: colors.cardSub, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  restHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  restValue: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  restNum: { fontFamily: fonts.numberBold, fontSize: 24, color: colors.leisure },
  restLabel: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
  track: { height: 14, borderRadius: 7, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7, backgroundColor: colors.leisure },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: colors.night, borderRadius: 16, paddingVertical: 9, paddingHorizontal: 12, gap: 2 },
  statLabel: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
  statValue: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  signal: { backgroundColor: '#262A63', borderRadius: 24, padding: 14, gap: 12, borderWidth: 2, borderColor: '#4A4F99' },
  signalHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.leisure, shadowColor: colors.leisure, shadowOpacity: 0.5, shadowRadius: 4 },
  signalTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: '#E4D6FF' },
  signalSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  signalCells: { flexDirection: 'row', gap: 6 },
  signalCell: { flex: 1, backgroundColor: colors.cardSub, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 6, alignItems: 'center', gap: 5 },
  signalIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.track, alignItems: 'center', justifyContent: 'center' },
  signalLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  signalValue: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, color: colors.textSub, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  bubbleText: { fontFamily: fonts.bodyHeavy, fontSize: 13, lineHeight: 20, color: colors.line },
  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, paddingHorizontal: 4 },
  suggests: { gap: 8 },
  suggest: { width: 148, height: 104, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 14, justifyContent: 'space-between' },
  suggestChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.leisure,
    color: colors.line,
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 10,
    overflow: 'hidden',
    fontFamily: fonts.bodyHeavy,
    fontSize: 12,
  },
  suggestName: { fontFamily: fonts.bodyHeavy, fontSize: 16, lineHeight: 21, color: colors.text },
  bundleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.cardSub, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.leisure },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  chipTextOn: { color: colors.line },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textMuted, paddingHorizontal: 4 },
  yearAgo: { backgroundColor: '#181F4C', borderRadius: 24, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  yearAgoFace: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.track, overflow: 'hidden', alignItems: 'center' },
  body: { flex: 1, gap: 3 },
  yearAgoDate: { fontFamily: fonts.number, fontSize: 12, color: colors.leisure },
  yearAgoText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 21, color: colors.text },
});
