// 쉼터 (2026-10-23 정리): 쉼 상태 · 가고 싶은 곳 · 다녀온 곳.
// 지침 신호 · 오늘의 쉼 제안 · 1년 전 오늘 · 날짜 잡기는 src/ui/features.ts에서 꺼 두었다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { withPrefix } from '../../src/copy/broadcasts.ko';
import { lastRestLine, PLACE_DURATION_LABEL, REST_BROADCAST, restCopy, WEEK_LABELS, yearAgoLine } from '../../src/copy/rest.ko';
import { newId } from '../../src/data/events';
import { lastLeisureDay } from '../../src/data/records';
import { parseDayKey, today as getToday, type DayKey } from '../../src/domain/day';
import { PLACE_DURATIONS, scheduledDate, wishAgain, type DurationFilter, type Place } from '../../src/domain/rest';
import { useLedger } from '../../src/state/ledger';
import { usePlaces } from '../../src/state/places';
import { useRecords } from '../../src/state/records';
import { restRange, useRestView } from '../../src/state/restView';
import { Ijang } from '../../src/ui/characters';
import { indexIconSvg } from '../../src/ui/characters/icons';
import { openPlace, VisitedCard, WishCard } from '../../src/ui/components/PlaceRow';
import { Screen } from '../../src/ui/components/Screen';
import { REST_FEATURES } from '../../src/ui/features';
import { colors, fonts } from '../../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const dotted = (d: DayKey) => {
  const { year, month, day } = parseDayKey(d);
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
};
const FILTERS: readonly DurationFilter[] = ['all', ...PLACE_DURATIONS];

/** 쉰 날 꽃 */
const FLOWER_SVG = `<svg viewBox="0 0 24 24"><g fill="${colors.leisure}" stroke="${colors.line}" stroke-width="1.2">${[0, 1, 2, 3, 4]
  .map((i) => {
    const a = i * 1.2566;
    return `<circle cx="${(12 + Math.sin(a) * 5).toFixed(1)}" cy="${(12 - Math.cos(a) * 5).toFixed(1)}" r="4.2"/>`;
  })
  .join('')}</g><circle cx="12" cy="12" r="3" fill="${colors.yellow}" stroke="${colors.line}" stroke-width="1.2"/></svg>`;

export default function RestScreen() {
  const today = getToday();
  const [tab, setTab] = useState<'wish' | 'visited'>('wish');
  const [filter, setFilter] = useState<DurationFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [lastLeisure, setLastLeisure] = useState<DayKey | null>(null);
  const byDate = useRecords((s) => s.byDate);
  const loadRange = useRecords((s) => s.loadRange);
  const places = usePlaces((s) => s.places);
  const loaded = usePlaces((s) => s.loaded);
  const loadPlaces = usePlaces((s) => s.load);
  const savePlace = usePlaces((s) => s.save);
  const events = useLedger((s) => s.events);
  const loadLedger = useLedger((s) => s.load);

  useFocusEffect(
    useCallback(() => {
      setNotice(null);
      const { from, to } = restRange(today);
      Promise.all([loadRange(from, to), loadPlaces(), loadLedger(), lastLeisureDay(today).then(setLastLeisure)]).catch((e) =>
        console.warn('[rest] load failed', e),
      );
    }, [today, loadRange, loadPlaces, loadLedger]),
  );

  const v = useRestView(byDate, places, lastLeisure, today, filter);
  const wishCount = places.filter((p) => !p.visited).length;

  const onWishAgain = async (p: Place) => {
    const copy = wishAgain(p, places, newId('pl'), today, Date.now());
    if (copy) await savePlace(copy);
    setNotice(copy ? restCopy.wishAgainDone : restCopy.wishAgainExists);
    setTab('wish');
    setFilter('all');
  };
  const add = () => router.push({ pathname: '/place-new', params: tab === 'visited' ? { visited: '1' } : {} });

  return (
    <Screen title="쉼터" broadcast={{ message: withPrefix(notice ?? REST_BROADCAST), time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.restHead}>
            <Text style={styles.cardTitle}>{restCopy.statusTitle}</Text>
            <View style={styles.restValue}>
              <Text style={styles.restLabel}>{v.restLabel}</Text>
              <Text style={styles.restNum}>{v.rest ?? '-'}</Text>
            </View>
          </View>
          <View style={styles.week}>
            {WEEK_LABELS.map((w, i) => (
              <View key={w} style={styles.day}>
                <View style={[styles.dayCell, v.week[i] && styles.dayRest]}>
                  {v.week[i] && <SvgXml xml={FLOWER_SVG} width={22} height={22} />}
                </View>
                <Text style={[styles.dayLabel, i === 6 && { color: colors.pinkSoft }]}>{w}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.lastRest}>{lastRestLine(v.lastRest)}</Text>
        </View>

        {REST_FEATURES.signal && v.signal && (
          <View style={styles.signal}>
            <View style={styles.signalHead}>
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
                  <SvgXml xml={indexIconSvg(k, colors.leisure, '#2E3775')} width={18} height={18} />
                  <Text style={styles.signalLabel}>{label}</Text>
                  <Text style={styles.signalValue}>{value}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.signalLine}>{v.signal.line}</Text>
          </View>
        )}

        {REST_FEATURES.suggestions && v.suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{restCopy.suggestTitle}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggests}>
              {v.suggestions.map((p) => (
                <Pressable key={p.id} onPress={() => openPlace(p)} style={styles.suggest}>
                  <Text style={styles.chip}>{PLACE_DURATION_LABEL[p.duration]}</Text>
                  <Text style={styles.suggestName} numberOfLines={2}>
                    {p.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.listHead}>
            <View style={styles.seg} accessibilityRole="tablist">
              {(['wish', 'visited'] as const).map((k) => (
                <Pressable
                  key={k}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === k }}
                  onPress={() => setTab(k)}
                  style={[styles.segItem, tab === k && styles.segOn]}
                >
                  <Text style={[styles.segText, tab === k && styles.segTextOn]}>
                    {k === 'wish' ? `${restCopy.wish} ${wishCount}` : `${restCopy.visited} ${v.visited.length}`}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable accessibilityRole="button" onPress={add} style={styles.add}>
              <Text style={styles.addText}>{restCopy.add}</Text>
            </Pressable>
          </View>

          {tab === 'wish' ? (
            <>
              <View style={styles.filters}>
                {FILTERS.map((f) => (
                  <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filter, filter === f && styles.filterOn]}>
                    <Text style={[styles.filterText, filter === f && styles.segTextOn]}>
                      {f === 'all' ? restCopy.filterAll : PLACE_DURATION_LABEL[f]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {v.wish.map((p) => (
                <WishCard key={p.id} place={p} scheduled={scheduledDate(p, events, today)} today={today} />
              ))}
              {loaded && v.wish.length === 0 && (
                <Text style={styles.empty}>{wishCount === 0 ? restCopy.wishEmpty : restCopy.wishFilterEmpty}</Text>
              )}
            </>
          ) : (
            <>
              {v.visited.map((p) => (
                <VisitedCard key={p.id} place={p} count={v.visitCounts.get(p.id)} onWishAgain={() => onWishAgain(p)} />
              ))}
              {loaded && v.visited.length === 0 && <Text style={styles.empty}>{restCopy.visitedEmpty}</Text>}
            </>
          )}
        </View>

        {REST_FEATURES.yearAgo && v.yearAgo && (
          <View style={styles.yearAgo}>
            <Ijang mood="base" size={44} />
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

const styles = StyleSheet.create({
  content: { padding: 12, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: colors.cardSub, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  restHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  restValue: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  restLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  restNum: { fontFamily: fonts.numberBold, fontSize: 24, color: colors.leisure },
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 4 },
  dayCell: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  dayRest: { backgroundColor: '#2E2A66' },
  dayLabel: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
  lastRest: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textSub },
  signal: { backgroundColor: '#262A63', borderRadius: 24, padding: 14, gap: 10, borderWidth: 2, borderColor: '#4A4F99' },
  signalHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signalTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: '#E4D6FF' },
  signalSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  signalCells: { flexDirection: 'row', gap: 6 },
  signalCell: { flex: 1, backgroundColor: colors.cardSub, borderRadius: 18, padding: 8, alignItems: 'center', gap: 4 },
  signalLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  signalValue: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub, textAlign: 'center' },
  signalLine: { fontFamily: fonts.bodyHeavy, fontSize: 13, lineHeight: 20, color: colors.text },
  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, paddingHorizontal: 4 },
  suggests: { gap: 8 },
  suggest: { width: 148, height: 104, borderRadius: 22, padding: 12, justifyContent: 'space-between', backgroundColor: '#2A2F6E' },
  suggestName: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  chip: {
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
  listHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seg: { flex: 1, flexDirection: 'row', height: 40, borderRadius: 20, backgroundColor: colors.cardSub, padding: 4, gap: 4 },
  segItem: { flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.leisure },
  segText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  segTextOn: { color: colors.line },
  add: { height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: colors.pink, justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: '#B32A6E' },
  addText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.line },
  filters: { flexDirection: 'row', gap: 6 },
  filter: { height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: colors.night, borderWidth: 1.5, borderColor: '#333C7A', justifyContent: 'center' },
  filterOn: { backgroundColor: colors.leisure, borderColor: colors.leisure },
  filterText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textMuted, paddingHorizontal: 4 },
  yearAgo: { backgroundColor: '#181F4C', borderRadius: 24, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, gap: 3 },
  yearAgoDate: { fontFamily: fonts.number, fontSize: 12, color: colors.leisure },
  yearAgoText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 21, color: colors.text },
});
