// 15d 보따리 지도 — 밤바다 위 솔빛 섬. 실제 지도가 아니다: 솔빛 마을을 가운데 섬으로 두고 장소를 겹치지 않게 자동 배치한다 (지도 API · 위치 권한 없음).
// 발자국 = 다녀온 곳(초록 길), 깃발 = 가고 싶은 곳(흐린 점선). 이장이 미는 곳(오래 담아둔 깃발)은 노란 깃발.
// 위 칩으로 전체 / 발자국 / 깃발만 골라 본다. 깃발 카드: [날짜 잡기] / [다녀왔슈].

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { withPrefix } from '../src/copy/broadcasts.ko';
import { WEEKDAYS } from '../src/copy/labels.ko';
import { flagAgeLabel, flagOldLine, MAP_BROADCAST, mapCopy, restCopy, tripLength, visitCountLabel } from '../src/copy/rest.ko';
import { newId } from '../src/data/events';
import { dDayLabel, parseDayKey, today as getToday, weekdayOf, type DayKey } from '../src/domain/day';
import { fireIndex } from '../src/domain/fire';
import { footprintPath, layoutPins, mapScale } from '../src/domain/placeMap';
import { FLAG_OLD_DAYS, keptDays, scheduledDate, tripDays, wishAgain, type Place } from '../src/domain/rest';
import { useLedger } from '../src/state/ledger';
import { usePlaces } from '../src/state/places';
import { useRecords } from '../src/state/records';
import { useRestLogs } from '../src/state/restLogs';
import { restRange } from '../src/state/restView';
import { Ijang } from '../src/ui/characters';
import { placeMapSvg, type MapArtPin, type MapFilter } from '../src/ui/characters/placeMapArt';
import { flagSvg, footprintSvg } from '../src/ui/characters/restIcons';
import { SubScreen } from '../src/ui/components/form';
import { colors, fonts } from '../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
const pad = (n: number) => String(n).padStart(2, '0');
const mdDow = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${pad(month)}.${pad(day)} (${WEEKDAYS[weekdayOf(d)]})`;
};
const ymd = (d: DayKey) => {
  const { year, month, day } = parseDayKey(d);
  return `${year}.${pad(month)}.${pad(day)}`;
};

/** 지도 칸 높이 / 너비 (디자인 15d: 약 355 x 400) */
const MAP_RATIO = 1.13;
const HIT = 44;

export default function PlaceMapScreen() {
  const today = getToday();
  const places = usePlaces((s) => s.places);
  const loadPlaces = usePlaces((s) => s.load);
  const savePlace = usePlaces((s) => s.save);
  const events = useLedger((s) => s.events);
  const loadLedger = useLedger((s) => s.load);
  const byDate = useRecords((s) => s.byDate);
  const loadRange = useRecords((s) => s.loadRange);
  const logs = useRestLogs((s) => s.logs);
  const loadLogs = useRestLogs((s) => s.load);
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [filter, setFilter] = useState<MapFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setNotice(null);
      const { from, to } = restRange(today);
      Promise.all([loadRange(from, to), loadPlaces(), loadLedger(), loadLogs()]).catch((e) => console.warn('[map] load failed', e));
    }, [today, loadRange, loadPlaces, loadLedger, loadLogs]),
  );

  const feet = places.filter((p) => p.visited).length;
  const flags = places.length - feet;
  const rest = useMemo(() => fireIndex({ logs, trips: tripDays(places) }, today, (d) => !!byDate[d]), [logs, places, byDate, today]);

  // 이장이 미는 곳: 오래 담아둔(60일 이상) 가장 오래된 깃발 — 날짜가 잡히지 않은 것만
  const pushed = useMemo(() => {
    const oldest = places.filter((p) => !p.visited && !p.eventId).sort((a, b) => a.createdAt - b.createdAt)[0];
    return oldest && keptDays(oldest, today) >= FLAG_OLD_DAYS ? oldest : null;
  }, [places, today]);
  const selected = places.find((p) => p.id === (picked ?? pushed?.id)) ?? null;

  const height = Math.round(width * MAP_RATIO);
  const art = useMemo(() => {
    if (!width) return null;
    const pins = layoutPins(places);
    const scale = mapScale(pins, width / 2 - 20, height / 2 - 46);
    const at = (x: number, y: number) => ({ x: width / 2 + x * scale, y: height / 2 + y * scale });
    const mapped: MapArtPin[] = pins.map(({ place: p, x, y }) => ({ id: p.id, name: p.name, visited: p.visited, pushed: p.id === pushed?.id, ...at(x, y) }));
    const trail = footprintPath(pins).map((t) => at(t.x, t.y));
    return { mapped, trail, center: at(0, 0) };
  }, [places, width, height, pushed?.id]);

  const xml = useMemo(
    () => (art ? placeMapSvg({ w: width, h: height, center: art.center, pins: art.mapped, trail: art.trail, filter, selectedId: selected?.id ?? null }) : ''),
    [art, width, height, filter, selected?.id],
  );

  const onWishAgain = async (p: Place) => {
    const copy = wishAgain(p, places, newId('pl'), today, Date.now());
    if (copy) await savePlace(copy);
    setNotice(copy ? restCopy.wishAgainDone : restCopy.wishAgainExists);
  };

  const chips: { key: MapFilter; label: string; dot?: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'foot', label: `${mapCopy.footprints} ${feet}`, dot: '#A8EB5A' },
    { key: 'flag', label: `${mapCopy.flags} ${flags}`, dot: colors.pink },
  ];

  return (
    <SubScreen title="쉼터" back="/rest" broadcast={{ message: withPrefix(notice ?? MAP_BROADCAST), time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={styles.chips}>
            {chips.map((c) => {
              const on = filter === c.key;
              return (
                <Pressable
                  key={c.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => setFilter(c.key)}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  {c.dot && <View style={[styles.dot, { backgroundColor: c.dot }]} />}
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.fire}>
            쉼 지수 <Text style={styles.fireNum}>{rest ?? '-'}</Text>
          </Text>
        </View>

        <View style={[styles.map, { height: height || undefined }]} onLayout={(e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width))}>
          {art && xml !== '' && (
            <>
              <SvgXml xml={xml} width={width} height={height} />
              {art.mapped
                .filter((p) => (p.visited ? filter !== 'flag' : filter !== 'foot'))
                .map((p) => (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.visited ? '발자국' : '깃발'} ${p.name}`}
                    onPress={() => setPicked(p.id)}
                    style={{ position: 'absolute', left: p.x - HIT / 2, top: p.visited ? p.y - HIT / 2 : p.y - 40, width: HIT, height: p.visited ? HIT : 50 }}
                  />
                ))}
              {places.length === 0 && <Text style={styles.mapEmpty}>{mapCopy.empty}</Text>}
            </>
          )}
        </View>

        <View style={styles.adds}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/place-new')} style={styles.add}>
            <Text style={styles.addText}>{mapCopy.addFlag}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/place-new', params: { visited: '1' } })} style={styles.add}>
            <Text style={styles.addText}>{mapCopy.addFoot}</Text>
          </Pressable>
        </View>

        {selected ? (
          selected.visited ? (
            <FootprintCard place={selected} count={countOf(places, selected)} onAgain={() => onWishAgain(selected)} />
          ) : (
            <FlagCard place={selected} scheduled={scheduledDate(selected, events, today)} today={today} pushed={selected.id === pushed?.id} />
          )
        ) : (
          places.length > 0 && <Text style={styles.pick}>{mapCopy.pick}</Text>
        )}
      </ScrollView>
    </SubScreen>
  );
}

/** 같은 이름(띄어쓰기 무시) 다녀온 횟수 — 가장 최근 카드에만 "n번 감" */
function countOf(places: readonly Place[], p: Place): number | undefined {
  const key = (n: string) => n.replace(/\s+/g, '');
  const same = places.filter((x) => x.visited && key(x.name) === key(p.name));
  if (same.length < 2) return undefined;
  const latest = [...same].sort((a, b) => (b.visitedDate ?? '').localeCompare(a.visitedDate ?? '') || b.createdAt - a.createdAt)[0];
  return latest.id === p.id ? same.length : undefined;
}

function FlagCard({ place, scheduled, today, pushed }: { place: Place; scheduled: DayKey | null; today: DayKey; pushed: boolean }) {
  const days = keptDays(place, today);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <SvgXml xml={flagSvg(colors.yellow)} width={26} height={30} />
        </View>
        <Pressable style={styles.cardBody} onPress={() => router.push({ pathname: '/place-new', params: { id: place.id } })}>
          <Text style={styles.cardName} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={styles.cardSub}>
            {scheduled ? (
              <>
                <Text style={styles.num}>{mdDow(scheduled)}</Text> · {mapCopy.scheduledTag} · {dDayLabel(scheduled, today)}
              </>
            ) : (
              flagAgeLabel(days)
            )}
          </Text>
          {!!place.memo && (
            <Text style={styles.cardNote} numberOfLines={2}>
              {place.memo}
            </Text>
          )}
        </Pressable>
        <View style={styles.cardBtns}>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/place-new', params: { id: place.id, mode: 'schedule' } })} style={styles.btn}>
            <Text style={styles.btnText}>{mapCopy.scheduleBtn}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/place-new', params: { id: place.id, mode: 'visit' } })} style={[styles.btn, styles.btnSub]}>
            <Text style={[styles.btnText, { color: colors.text }]}>{mapCopy.visitedBtn}</Text>
          </Pressable>
        </View>
      </View>
      {pushed && !scheduled && (
        <View style={styles.bubbleRow}>
          <Ijang mood="base" size={52} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{flagOldLine(days)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function FootprintCard({ place, count, onAgain }: { place: Place; count: number | undefined; onAgain: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <SvgXml xml={footprintSvg('#A8EB5A')} width={26} height={30} />
        </View>
        <Pressable style={styles.cardBody} onPress={() => router.push({ pathname: '/place-new', params: { id: place.id } })}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {place.name}
            </Text>
            {count && <Text style={styles.count}>{visitCountLabel(count)}</Text>}
          </View>
          <Text style={styles.cardSub}>
            {place.visitedDate && <Text style={styles.num}>{ymd(place.visitedDate)}</Text>}
            {place.visitedDate ? ' · ' : ''}
            {tripLength(place.nights)}
          </Text>
          {!!place.note && (
            <Text style={styles.cardNote} numberOfLines={2}>
              “{place.note}”
            </Text>
          )}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onAgain} style={[styles.btn, styles.btnSub]}>
          <Text style={[styles.btnText, { color: colors.text }]}>{mapCopy.wishAgainBtn}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 12, paddingBottom: 24 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: '#232B60' },
  chipOn: { backgroundColor: colors.yellow, borderBottomWidth: 3, borderBottomColor: '#C9A800' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  chipTextOn: { color: colors.line },
  fire: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  fireNum: { fontFamily: fonts.numberBold, fontSize: 15, color: colors.leisure },
  map: { borderRadius: 26, overflow: 'hidden' },
  mapEmpty: { position: 'absolute', bottom: 70, left: 20, right: 20, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  adds: { flexDirection: 'row', gap: 8 },
  add: { flex: 1, height: 40, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#333C7A', alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  pick: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: colors.cardSub, borderRadius: 26, padding: 14, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { flexShrink: 1, fontFamily: fonts.bodyHeavy, fontSize: 18, color: colors.text },
  cardSub: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  cardNote: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 17, color: colors.textSub },
  num: { fontFamily: fonts.number },
  count: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.yellow, backgroundColor: colors.track, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  cardBtns: { gap: 6 },
  btn: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.pinkShadow,
  },
  btnSub: { backgroundColor: '#2E3775', borderBottomColor: '#232B60' },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.line },
  bubbleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: { flex: 1, backgroundColor: colors.text, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
  bubbleText: { fontFamily: fonts.bodyBold, fontSize: 14, lineHeight: 21, color: colors.line },
});
