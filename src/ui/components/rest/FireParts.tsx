// 모닥불 탭의 조각 (디자인 15a · 34a): 불 카드 · 이번 주 장작 · 다녀온 곳 줄. 순서와 배치는 app/(tabs)/rest.tsx가 정한다.

import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { WEEKDAYS } from '../../../copy/labels.ko';
import { fireCopy, FIRE_LINE, fireSubLabel, SIZE_LABEL, stayLabel } from '../../../copy/rest.ko';
import { parseDayKey, weekdayOf, type DayKey } from '../../../domain/day';
import { fireMood, isVisitLog, type FireBand, type RestLog, type WeekDay } from '../../../domain/fire';
import type { Place } from '../../../domain/rest';
import { DAY_WOOD, dayWoodSvg } from '../../characters/restIcons';
import { restSceneFxSvg, restSceneSvg } from '../../characters/restScene';
import { colors, fonts } from '../../theme';

/** 불 상태 제목 색 (디자인 15a: 사그라들 때 주황) */
const FIRE_COLOR = { none: '#8FD3FF', off: '#8FD3FF', mid: '#FFC23C', hot: '#FF8A6B' } as const;

const pad = (n: number) => String(n).padStart(2, '0');
/** 10.24 */
export const mdLabel = (d: DayKey) => {
  const { month, day } = parseDayKey(d);
  return `${month}.${pad(day)}`;
};
/** 이번 주 범위: 10.19 – 10.25 */
export const weekRangeLabel = (mon: DayKey, sun: DayKey) => `${mdLabel(mon)} – ${mdLabel(sun)}`;

/** 방금 들어온 항목 표시: 노란 테두리 + 반짝이는 별 */
function Sparkle() {
  const o = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(o, { toValue: 0.3, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  const star = (x: number, y: number, r: number, c: string) =>
    `<path transform="translate(${x} ${y})" d="M0 ${-r} Q0 0 ${r} 0 Q0 0 0 ${r} Q0 0 ${-r} 0 Q0 0 0 ${-r}Z" fill="${c}" stroke="#10142E" stroke-width="1.6" stroke-linejoin="round"/>`;
  const xml = `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">${star(16, 13, 9, '#FFE14D')}${star(4, 24, 4.5, '#FFFFFF')}</svg>`;
  return (
    <Animated.View pointerEvents="none" style={[styles.sparkle, { opacity: o }]}>
      <SvgXml xml={xml} width={30} height={30} />
    </Animated.View>
  );
}

/** 풍경 카드 (디자인 1a): 밤 풍경 위에 모닥불 · 구구 할매 · 불 상태 제목 + "쉼 지수 n · 이번 주 장작 n개" */
export function RestSceneCard({ band, rest, weekCount }: { band: FireBand | null; rest: number | null; weekCount: number }) {
  const mood = fireMood(band);
  const key = band === null ? 'none' : mood;
  const xml = useMemo(() => restSceneSvg(mood), [mood]);
  const fx = useMemo(() => restSceneFxSvg(mood), [mood]);
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!fx) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fx, pulse]);
  return (
    <View style={styles.scene}>
      {/* 칸은 366 x 280 그림을 가로에 맞추고 넘치는 곳은 잘라 낸다 (시안: preserveAspectRatio slice) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SvgXml xml={xml} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        {fx && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulse }]}>
            <SvgXml xml={fx} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
          </Animated.View>
        )}
      </View>
      <View style={styles.sceneHead} pointerEvents="none">
        <Text style={[styles.sceneTitle, { color: FIRE_COLOR[key] }]}>{FIRE_LINE[key]}</Text>
        <Text style={styles.sceneSub}>{fireSubLabel(rest, weekCount)}</Text>
      </View>
    </View>
  );
}

/** [장작 던지기] (디자인 1a: 풍경 카드 아래 노란 44) */
export function ThrowButton({ onThrow }: { onThrow: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onThrow} style={({ pressed }) => [styles.throwBtn, pressed && styles.throwPressed]}>
      <Text style={styles.throwText}>장작 던지기</Text>
    </Pressable>
  );
}

/** 이번 주 장작 요일 띠: 월~일 7칸, 칸마다 그날 장작이 크기대로 놓이고, 누르면 아래 카드가 바뀐다 */
export function WeekStrip({
  days,
  range,
  selected,
  freshDate,
  onSelect,
  onLayoutY,
}: {
  days: readonly WeekDay[];
  range: string;
  selected: DayKey;
  freshDate: DayKey | null;
  onSelect: (d: DayKey) => void;
  onLayoutY?: (y: number) => void;
}) {
  return (
    <View style={styles.block} onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}>
      <View style={styles.blockHead}>
        <Text style={styles.blockTitle}>{fireCopy.thisWeek}</Text>
        <Text style={styles.blockRange}>{range}</Text>
      </View>
      <View style={styles.strip}>
        {days.map((d) => {
          const on = d.date === selected;
          const kind = d.size ?? 'empty';
          const glyph = DAY_WOOD[kind];
          return (
            <Pressable
              key={d.date}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${mdLabel(d.date)} ${WEEKDAYS[weekdayOf(d.date)]} ${d.size ? SIZE_LABEL[d.size] : '장작 없음'}`}
              onPress={() => onSelect(d.date)}
              style={[styles.cell, on && styles.cellOn, d.date === freshDate && styles.cellFresh]}
            >
              {d.visit && <View style={styles.cellDot} />}
              <View style={styles.cellGlyph}>
                <SvgXml xml={dayWoodSvg(kind)} width={glyph.w} height={glyph.h} />
              </View>
              <Text style={[styles.cellDow, on && styles.cellDowOn]}>{WEEKDAYS[weekdayOf(d.date)]}</Text>
              <Text style={styles.cellDt}>{mdLabel(d.date)}</Text>
              {d.date === freshDate && <Sparkle />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** 고른 날 카드: 날짜(요일) · 크기 · 다녀옴 · 한 줄 · 태그. 그날 기록마다 한 장, 누르면 기록 고치기 시트. 없으면 빈 날 문구 */
export function DayCards({ day, freshId, onPress }: { day: WeekDay; freshId: string | null; onPress: (log: RestLog) => void }) {
  const head = `${mdLabel(day.date)} (${WEEKDAYS[weekdayOf(day.date)]})`;
  if (day.logs.length === 0) {
    return (
      <View style={styles.dayCard}>
        <Text style={styles.dayHead}>{head}</Text>
        <Text style={styles.dayText}>{fireCopy.emptyDay}</Text>
      </View>
    );
  }
  return (
    <View style={styles.rows}>
      {day.logs.map((l) => (
        <Pressable
          key={l.id}
          accessibilityRole="button"
          accessibilityLabel={`${head} ${l.text || '쉼'} 고치기`}
          onPress={() => onPress(l)}
          style={[styles.dayCard, l.id === freshId && styles.rowFresh]}
        >
          <View style={styles.dayTop}>
            <Text style={styles.dayHead}>{head}</Text>
            <View style={styles.sizeChip}>
              <Text style={styles.sizeChipText}>{SIZE_LABEL[l.size]}</Text>
            </View>
            {isVisitLog(l) && (
              <View style={styles.visitBadge}>
                <Text style={styles.visitBadgeText}>{fireCopy.visitedBadge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.dayText}>{l.text || '쉼'}</Text>
          {l.tags.length > 0 && (
            <View style={styles.rowTags}>
              {l.tags.map((t) => (
                <View key={`${t.kind}:${t.ref ?? ''}:${t.label}`} style={styles.dayTag}>
                  <Text style={styles.dayTagText}>{t.label}</Text>
                </View>
              ))}
            </View>
          )}
          {l.id === freshId && <Sparkle />}
        </Pressable>
      ))}
    </View>
  );
}

/**
 * 다녀온 곳 줄: 장소 이름 · 다녀온 날짜 · 머문 일수 카드 가로 목록 + 개수. 없으면 줄을 숨긴다 (34a).
 * (시안 15a에는 이 줄의 그림이 없어 이번 주 장작 줄과 같은 톤으로 만들었다.)
 */
export function VisitedRow({ places, freshId, onPress }: { places: readonly Place[]; freshId: string | null; onPress: (p: Place) => void }) {
  if (places.length === 0) return null;
  return (
    <View style={styles.block}>
      <View style={styles.blockHead}>
        <Text style={styles.blockTitle}>{fireCopy.visitedTitle}</Text>
        <Text style={styles.blockRange}>{fireCopy.visitedCount(places.length)}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        {places.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`다녀온 곳 ${p.name}`}
            onPress={() => onPress(p)}
            style={[styles.visitCard, p.id === freshId && styles.rowFresh]}
          >
            <Text style={styles.visitName} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={styles.visitDate}>{p.visitedDate ? mdLabel(p.visitedDate) : ''}</Text>
            <Text style={styles.visitStay}>{stayLabel(p.nights)}</Text>
            {p.id === freshId && <Sparkle />}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { height: 280, borderRadius: 28, overflow: 'hidden', backgroundColor: '#0F1636', borderWidth: 2, borderColor: '#2B3370' },
  sceneHead: { position: 'absolute', left: 16, top: 14, gap: 2 },
  sceneTitle: { fontFamily: fonts.title, fontSize: 22, lineHeight: 28 },
  sceneSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub },
  throwBtn: { height: 44, borderRadius: 22, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: '#C9A800' },
  throwPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  throwText: { fontFamily: fonts.title, fontSize: 16, color: colors.line },
  strip: { flexDirection: 'row', gap: 4 },
  cell: { flex: 1, minWidth: 0, height: 104, borderRadius: 18, backgroundColor: colors.cardSub, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'flex-end', gap: 6, paddingBottom: 8 },
  cellOn: { backgroundColor: '#2E3775', borderColor: colors.yellow },
  cellFresh: { borderColor: colors.yellow },
  cellDot: { position: 'absolute', right: 5, top: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.relation },
  cellGlyph: { height: 44, justifyContent: 'flex-end', alignItems: 'center' },
  cellDow: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  cellDowOn: { color: colors.yellow },
  cellDt: { fontFamily: fonts.number, fontSize: 10, color: colors.textMuted },
  dayCard: { backgroundColor: colors.cardSub, borderRadius: 24, padding: 16, gap: 10, borderWidth: 3, borderColor: '#333C7A' },
  dayTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayHead: { fontFamily: fonts.numberBold, fontSize: 16, color: colors.yellow },
  dayText: { fontFamily: fonts.bodyHeavy, fontSize: 16, lineHeight: 23, color: colors.text },
  dayTag: { height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#2E3775', justifyContent: 'center' },
  dayTagText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
  sizeChip: { height: 22, paddingHorizontal: 9, borderRadius: 11, backgroundColor: '#8E5A38', justifyContent: 'center' },
  sizeChipText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.text },

  block: { gap: 8 },
  blockHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 6 },
  blockTitle: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  blockRange: { fontFamily: fonts.number, fontSize: 12, color: colors.textMuted },
  rows: { gap: 6 },
  rowFresh: { borderColor: colors.yellow },
  rowTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  visitBadge: { height: 20, paddingHorizontal: 7, borderRadius: 10, backgroundColor: colors.relation, justifyContent: 'center' },
  visitBadgeText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.line },
  sparkle: { position: 'absolute', right: -6, top: -10, width: 30, height: 30 },
  cards: { gap: 8, paddingHorizontal: 2, paddingTop: 10, paddingBottom: 2 },
  visitCard: { width: 124, backgroundColor: colors.cardSub, borderRadius: 20, padding: 12, gap: 4, borderWidth: 3, borderColor: 'transparent' },
  visitName: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  visitDate: { fontFamily: fonts.number, fontSize: 12, color: colors.textMuted },
  visitStay: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
});
