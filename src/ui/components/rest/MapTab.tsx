// 쉼터 · 보따리 지도 탭 (디자인 15c · 15d, TURN 34). 별도 화면이 아니라 쉼터 탭 안에 그린다.
// 지도에는 가고 싶은 곳(깃발)만 둔다 — 발자국 · 다녀온 길 · 칩 · + 발자국은 없다. 깃발 자리와 섬은 domain/placeMap.ts.
// 깃발 카드: [날짜 잡기] / (날짜 잡은 깃발은) [날짜 바꾸기] · [다녀왔슈]. [다녀왔슈]는 부모가 장작 던지기 시트를 연다.

import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { WEEKDAYS } from '../../../copy/labels.ko';
import { flagAgeLabel, flagOldLine, mapCopy } from '../../../copy/rest.ko';
import { dDayLabel, parseDayKey, weekdayOf, type DayKey } from '../../../domain/day';
import type { VillageEvent } from '../../../domain/events';
import { flagInfo, layoutIslands, pushedFlag, type FlagKind } from '../../../domain/placeMap';
import { keptDays, type Place } from '../../../domain/rest';
import { flagIconSvg, mapView, placeMapFxSvg, placeMapSvg, type MapArtFlag } from '../../characters/placeMapArt';
import { Ijang } from '../../characters';
import { colors, fonts } from '../../theme';

const pad = (n: number) => String(n).padStart(2, '0');
const mdDow = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${month}.${pad(day)} (${WEEKDAYS[weekdayOf(d)]})`;
};

/** 깃발 하나의 화면용 정보 (지도 · 카드 · 방송이 같이 쓴다) */
export type MapFlagView = { place: Place; kind: FlagKind; date: DayKey | null; days: number | null; dday: string | null };

/** 지도에 놓인 깃발 + 고른 깃발. 규칙은 domain/placeMap.ts */
export function useMapView(places: readonly Place[], events: readonly VillageEvent[], today: DayKey, pickedId: string | null) {
  return useMemo(() => {
    const layout = layoutIslands(places);
    const pushed = pushedFlag(places, today);
    const flags = layout.pins.map((p) => {
      const info = flagInfo(p.place, events, pushed?.id ?? null, today);
      return { ...p, view: { place: p.place, ...info, dday: info.date ? dDayLabel(info.date, today) : null } as MapFlagView };
    });
    const selected = flags.find((f) => f.place.id === (pickedId ?? pushed?.id))?.view ?? null;
    return { layout, flags, selected, pushedId: pushed?.id ?? null };
  }, [places, events, today, pickedId]);
}

type Props = {
  places: readonly Place[];
  events: readonly VillageEvent[];
  today: DayKey;
  rest: number | null;
  pickedId: string | null;
  onPick: (id: string) => void;
  /** [다녀왔슈] */
  onVisit: (place: Place) => void;
};

export function MapTab({ places, events, today, rest, pickedId, onPick, onVisit }: Props) {
  const [width, setWidth] = useState(0);
  const m = useMapView(places, events, today, pickedId);
  const wantCount = places.filter((p) => !p.visited).length;

  const view = mapView(m.layout.islands.length);
  const scale = width / view.w;
  const height = Math.round(width * (view.h / view.w));

  const artFlags = useMemo<MapArtFlag[]>(
    () =>
      m.flags.map((f) => ({ id: f.place.id, name: f.place.name, kind: f.view.kind, dday: f.view.dday ?? undefined, x: f.x, y: f.y })),
    [m.flags],
  );
  const art = useMemo(
    () => ({ flags: artFlags, islands: m.layout.islands.map((i) => ({ cx: i.cx, cy: i.cy, fresh: i.fresh })), selectedId: m.selected?.place.id ?? null }),
    [artFlags, m.layout.islands, m.selected?.place.id],
  );
  const xml = useMemo(() => (width ? placeMapSvg(art) : ''), [art, width]);
  const fx = useMemo(() => (width ? placeMapFxSvg(art) : null), [art, width]);

  // 퍼지는 동그라미 · 새 섬 반짝임: 투명도로 깜빡인다
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!fx) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fx, pulse]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <View style={styles.chip}>
            <View style={styles.chipDot} />
            <Text style={styles.chipText}>{mapCopy.want(wantCount)}</Text>
          </View>
          <AddFlagButton />
        </View>
        <Text style={styles.fire}>
          쉼 지수 <Text style={styles.fireNum}>{rest ?? '-'}</Text>
        </Text>
      </View>

      <View style={[styles.map, { height: height || undefined }]} onLayout={(e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width))}>
        {width > 0 && (
          <>
            <SvgXml xml={xml} width={width} height={height} />
            {fx && (
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: pulse }]}>
                <SvgXml xml={fx} width={width} height={height} />
              </Animated.View>
            )}
            {m.flags.map((f) => (
              <Pressable
                key={f.place.id}
                accessibilityRole="button"
                accessibilityLabel={`깃발 ${f.place.name}`}
                onPress={() => onPick(f.place.id)}
                style={{ position: 'absolute', left: (f.x - view.x) * scale - 24, top: (f.y - view.y - 56) * scale, width: 48, height: 84 * scale }}
              />
            ))}
            {m.flags.length === 0 && <Text style={styles.mapEmpty}>{mapCopy.empty}</Text>}
          </>
        )}
        <View pointerEvents="none" style={styles.mapEdge} />
        <View pointerEvents="none" style={styles.legend}>
          {mapCopy.legend.map((label, i) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: ['#FF4FA0', '#FFE14D', '#A8EB5A'][i] }]} />
              <Text style={styles.legendText}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {m.selected ? (
        <FlagCard flag={m.selected} today={today} onVisit={() => onVisit(m.selected!.place)} />
      ) : (
        wantCount > 0 && <Text style={styles.pick}>{mapCopy.pick}</Text>
      )}
    </ScrollView>
  );
}

/**
 * 가고 싶은 곳 추가 (시안에 없음, 임시): 시안에서 + 깃발 버튼을 없앤 뒤 깃발을 만드는 길이 그려져 있지 않아
 * 지도 탭 위쪽 "가고 싶은 곳 n" 오른쪽에 작은 + 하나만 둔다. 기존 /place-new(깃발 만들기)로 간다.
 * 바꾸거나 없앨 때는 이 컴포넌트 하나만 고치면 된다.
 */
function AddFlagButton() {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={mapCopy.addA11y} onPress={() => router.push('/place-new')} style={styles.add}>
      <Text style={styles.addText}>+</Text>
    </Pressable>
  );
}

function FlagCard({ flag, today, onVisit }: { flag: MapFlagView; today: DayKey; onVisit: () => void }) {
  const { place, kind, date, dday } = flag;
  const days = keptDays(place, today);
  const sub =
    kind === 'date' && date ? `${dday} · ${mdDow(date)}` : kind === 'ijang' ? mapCopy.pushedSub(flagAgeLabel(days)) : flagAgeLabel(days);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardIcon}>
          <SvgXml xml={flagIconSvg(kind, dday ?? undefined)} width={44} height={44} />
        </View>
        <Pressable style={styles.cardBody} onPress={() => router.push({ pathname: '/place-new', params: { id: place.id } })}>
          <Text style={styles.cardName} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={styles.cardSub}>{sub}</Text>
          {!!place.memo && (
            <Text style={styles.cardNote} numberOfLines={2}>
              {place.memo}
            </Text>
          )}
        </Pressable>
      </View>
      <View style={styles.cardBtns}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/place-new', params: { id: place.id, mode: 'schedule' } })}
          style={[styles.btn, styles.btnSub]}
        >
          <Text style={[styles.btnText, { color: colors.textSub }]}>{kind === 'date' ? mapCopy.rescheduleBtn : mapCopy.scheduleBtn}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onVisit} style={[styles.btn, styles.btnPink]}>
          <Text style={styles.btnText}>{mapCopy.visitedBtn}</Text>
        </Pressable>
      </View>
      {kind === 'ijang' && (
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

const styles = StyleSheet.create({
  content: { padding: 12, gap: 12, paddingBottom: 24 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: '#2E3775' },
  chipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pink },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  add: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderStyle: 'dashed', borderColor: '#4A5290', alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: fonts.bodyHeavy, fontSize: 18, lineHeight: 22, color: colors.textSub },
  fire: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  fireNum: { fontFamily: fonts.numberBold, fontSize: 15, color: colors.leisure },
  map: { borderRadius: 28, overflow: 'hidden', backgroundColor: '#1B2A55' },
  mapEdge: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 28, borderWidth: 3, borderColor: '#2B3D73' },
  mapEmpty: { position: 'absolute', bottom: 56, left: 20, right: 20, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  legend: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(20,26,62,.88)', borderRadius: 14, paddingVertical: 6, paddingHorizontal: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: colors.line },
  legendText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textSub },
  pick: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: colors.cardSub, borderRadius: 24, padding: 14, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1B2A55', borderWidth: 2, borderColor: '#2B3D73', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  cardSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted },
  cardNote: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 17, color: colors.textSub },
  cardBtns: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  btnSub: { backgroundColor: '#2E3775' },
  btnPink: { backgroundColor: colors.pink, borderBottomWidth: 3, borderBottomColor: colors.pinkShadow },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.line },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { flex: 1, backgroundColor: colors.text, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 6, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  bubbleText: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, color: colors.line },
});
