// 15c 보따리 지도. 실제 지도가 아니다 — 솔빛 마을을 한가운데 두고 장소를 겹치지 않게 자동 배치한다 (지도 API · 위치 권한 없음).
// 발자국 = 다녀온 곳, 깃발 = 가고 싶은 곳. 다녀온 경로는 점선. 깃발 카드: [날짜 잡기] / [다녀왔슈].

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';

import { withPrefix } from '../src/copy/broadcasts.ko';
import { LEISURE_STATUS, WEEKDAYS } from '../src/copy/labels.ko';
import { flagAgeLabel, flagOldLine, MAP_BROADCAST, mapCopy, restCopy, tripLength, visitCountLabel } from '../src/copy/rest.ko';
import { newId } from '../src/data/events';
import { dDayLabel, parseDayKey, today as getToday, weekdayOf, type DayKey } from '../src/domain/day';
import { fireBand, fireIndex } from '../src/domain/fire';
import { footprintPath, layoutPins, mapScale, PIN_SIZE } from '../src/domain/placeMap';
import { FLAG_OLD_DAYS, keptDays, scheduledDate, tripDays, wishAgain, type Place } from '../src/domain/rest';
import { useLedger } from '../src/state/ledger';
import { usePlaces } from '../src/state/places';
import { useRecords } from '../src/state/records';
import { useRestLogs } from '../src/state/restLogs';
import { restRange } from '../src/state/restView';
import { flagSvg, footprintSvg, villagePinSvg } from '../src/ui/characters/restIcons';
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

const MAP_HEIGHT = 380;

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
  const [notice, setNotice] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setNotice(null);
      const { from, to } = restRange(today);
      Promise.all([loadRange(from, to), loadPlaces(), loadLedger(), loadLogs()]).catch((e) => console.warn('[map] load failed', e));
    }, [today, loadRange, loadPlaces, loadLedger, loadLogs]),
  );

  const pins = useMemo(() => layoutPins(places), [places]);
  const path = useMemo(() => footprintPath(pins), [pins]);
  const feet = places.filter((p) => p.visited).length;
  const flags = places.length - feet;
  const rest = useMemo(
    () => fireIndex({ logs, trips: tripDays(places) }, today, (d) => !!byDate[d]),
    [logs, places, byDate, today],
  );

  // 처음엔 가장 오래된 깃발 (오래됐을 때만) 을 짚어 둔다
  const defaultPick = useMemo(() => {
    const oldest = places.filter((p) => !p.visited).sort((a, b) => a.createdAt - b.createdAt)[0];
    return oldest && keptDays(oldest, today) >= FLAG_OLD_DAYS ? oldest.id : null;
  }, [places, today]);
  const selected = places.find((p) => p.id === (picked ?? defaultPick)) ?? null;

  const halfW = width / 2;
  const halfH = MAP_HEIGHT / 2;
  const scale = width ? mapScale(pins, halfW, halfH) : 1;
  const at = (x: number, y: number) => ({ left: halfW + x * scale - PIN_SIZE / 2, top: halfH + y * scale - PIN_SIZE / 2 });

  const onWishAgain = async (p: Place) => {
    const copy = wishAgain(p, places, newId('pl'), today, Date.now());
    if (copy) await savePlace(copy);
    setNotice(copy ? restCopy.wishAgainDone : restCopy.wishAgainExists);
  };

  return (
    <SubScreen
      title="쉼터"
      back="/rest"
      broadcast={{ message: withPrefix(notice ?? MAP_BROADCAST), time: timeLabel(new Date()) }}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={styles.chips}>
            <Text style={[styles.chip, { color: colors.health }]}>
              {mapCopy.footprints} {feet}
            </Text>
            <Text style={[styles.chip, { color: colors.yellow }]}>
              {mapCopy.flags} {flags}
            </Text>
          </View>
          <Text style={styles.fire}>
            쉼 지수 <Text style={styles.fireNum}>{rest ?? '-'}</Text>
            {rest !== null ? ` · ${LEISURE_STATUS[fireBand(rest)]}` : ''}
          </Text>
        </View>

        <View style={styles.map} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 && (
            <>
              <Svg width={width} height={MAP_HEIGHT} style={StyleSheet.absoluteFill}>
                {path.length > 1 && (
                  <Polyline
                    points={path.map((p) => `${halfW + p.x * scale},${halfH + p.y * scale}`).join(' ')}
                    fill="none"
                    stroke={colors.health}
                    strokeWidth={2.4}
                    strokeDasharray="2 8"
                    strokeLinecap="round"
                  />
                )}
              </Svg>
              <View style={[styles.pin, at(0, 0)]} pointerEvents="none">
                <SvgXml xml={villagePinSvg()} width={PIN_SIZE + 8} height={PIN_SIZE + 8} />
              </View>
              {pins.map(({ place: p, x, y }) => {
                const on = selected?.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.visited ? '발자국' : '깃발'} ${p.name}`}
                    onPress={() => setPicked(p.id)}
                    style={[styles.pin, at(x, y), on && styles.pinOn]}
                  >
                    <SvgXml
                      xml={p.visited ? footprintSvg(colors.health) : flagSvg(colors.yellow, keptDays(p, today) >= FLAG_OLD_DAYS)}
                      width={PIN_SIZE - 6}
                      height={PIN_SIZE - 2}
                    />
                    <Text style={styles.pinName} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
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
            <FlagCard place={selected} scheduled={scheduledDate(selected, events, today)} today={today} />
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

function FlagCard({ place, scheduled, today }: { place: Place; scheduled: DayKey | null; today: DayKey }) {
  const days = keptDays(place, today);
  const old = days >= FLAG_OLD_DAYS;
  return (
    <View style={styles.cardWrap}>
      {old && !scheduled && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{flagOldLine(days)}</Text>
        </View>
      )}
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <SvgXml xml={flagSvg(colors.yellow, old)} width={26} height={30} />
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
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/place-new', params: { id: place.id, mode: 'schedule' } })}
            style={[styles.btn, styles.btnSub]}
          >
            <Text style={[styles.btnText, { color: colors.text }]}>{mapCopy.scheduleBtn}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/place-new', params: { id: place.id, mode: 'visit' } })} style={styles.btn}>
            <Text style={styles.btnText}>{mapCopy.visitedBtn}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function FootprintCard({ place, count, onAgain }: { place: Place; count: number | undefined; onAgain: () => void }) {
  return (
    <View style={styles.cardWrap}>
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <SvgXml xml={footprintSvg(colors.health)} width={26} height={30} />
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  chips: { flexDirection: 'row', gap: 6 },
  chip: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 13,
    backgroundColor: colors.cardSub,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  fire: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
  fireNum: { fontFamily: fonts.numberBold, fontSize: 15, color: colors.leisure },
  map: { height: MAP_HEIGHT, borderRadius: 26, backgroundColor: '#181F4C', overflow: 'hidden', borderWidth: 2, borderColor: '#2B3370' },
  pin: { position: 'absolute', width: PIN_SIZE, height: PIN_SIZE + 14, alignItems: 'center' },
  pinOn: { backgroundColor: 'rgba(255,225,77,.16)', borderRadius: 14 },
  pinName: { fontFamily: fonts.bodyHeavy, fontSize: 10, color: colors.textSub, maxWidth: 64, textAlign: 'center' },
  mapEmpty: { position: 'absolute', bottom: 24, left: 20, right: 20, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  adds: { flexDirection: 'row', gap: 8 },
  add: { flex: 1, height: 40, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', borderColor: '#333C7A', alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  pick: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  cardWrap: { gap: 8 },
  bubble: { backgroundColor: colors.card, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14 },
  bubbleText: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.text },
  card: { backgroundColor: colors.cardSub, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { flexShrink: 1, fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  cardSub: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 17, color: colors.textMuted },
  cardNote: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 17, color: colors.textSub },
  num: { fontFamily: fonts.number },
  count: {
    fontFamily: fonts.bodyHeavy,
    fontSize: 11,
    color: colors.yellow,
    backgroundColor: colors.track,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  cardBtns: { gap: 6 },
  btn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: colors.pink,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.pinkShadow,
  },
  btnSub: { backgroundColor: colors.track, borderBottomColor: '#232B60' },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.line },
});
