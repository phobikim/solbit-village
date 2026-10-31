// 모닥불 탭의 조각 (디자인 15a · 34a): 불 카드 · 이번 주 장작 · 다녀온 곳 줄. 순서와 배치는 app/(tabs)/rest.tsx가 정한다.

import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { WEEKDAYS } from '../../../copy/labels.ko';
import { fireCopy, FIRE_LINE, fireSubLabel, SIZE_LABEL, stayLabel } from '../../../copy/rest.ko';
import { parseDayKey, weekdayOf, type DayKey } from '../../../domain/day';
import { isVisitLog, type FireBand, type RestLog, type RestSize } from '../../../domain/fire';
import type { Place } from '../../../domain/rest';
import { fireHeight, fireSvg } from '../../characters/restIcons';
import { colors, fonts } from '../../theme';

/** 불 상태 제목 색 (디자인 15a: 사그라들 때 주황) */
const FIRE_COLOR = { none: colors.textSub, blaze: '#FFC23C', burning: '#FFC23C', dying: '#FF9A3C', out: '#FF8A5C' } as const;
const SIZE_BAR: Record<RestSize, number> = { twig: 18, firewood: 28, log: 40 };

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

/** 불 카드: 불 · 상태 제목 · "쉼 지수 31 · 이번 주 장작 5개" · [장작 던지기] */
export function FireCard({ band, rest, weekCount, onThrow }: { band: FireBand | null; rest: number | null; weekCount: number; onThrow: () => void }) {
  const key = band ?? 'none';
  return (
    <View style={styles.card}>
      <SvgXml xml={fireSvg(band)} width={200} height={fireHeight(band)} />
      <View style={styles.fireText}>
        <Text style={[styles.fireLine, { color: FIRE_COLOR[key] }]}>{FIRE_LINE[key]}</Text>
        <Text style={styles.fireSub}>{fireSubLabel(rest, weekCount)}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onThrow} style={({ pressed }) => [styles.throwBtn, pressed && styles.throwPressed]}>
        <Text style={styles.throwText}>장작 던지기</Text>
      </Pressable>
    </View>
  );
}

/** 이번 주 장작: 날짜(요일) · 한 줄 기록 · 태그 · 크기. 항목을 누르면 기록 고치기 시트 */
export function WeekList({
  logs,
  range,
  freshId,
  onPress,
  onLayoutY,
}: {
  logs: readonly RestLog[];
  range: string;
  freshId: string | null;
  onPress: (log: RestLog) => void;
  onLayoutY?: (y: number) => void;
}) {
  return (
    <View style={styles.block} onLayout={(e) => onLayoutY?.(e.nativeEvent.layout.y)}>
      <View style={styles.blockHead}>
        <Text style={styles.blockTitle}>{fireCopy.thisWeek}</Text>
        <Text style={styles.blockRange}>{range}</Text>
      </View>
      {logs.length > 0 ? (
        <View style={styles.rows}>
          {logs.map((l) => (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityLabel={`${mdLabel(l.date)} ${l.text || '쉼'} 고치기`}
              onPress={() => onPress(l)}
              style={[styles.row, l.id === freshId && styles.rowFresh]}
            >
              <View style={styles.rowDate}>
                <Text style={styles.rowDt}>{mdLabel(l.date)}</Text>
                <Text style={styles.rowDow}>{WEEKDAYS[weekdayOf(l.date)]}</Text>
              </View>
              <View style={styles.rowMid}>
                <Text style={styles.rowText} numberOfLines={1}>
                  {l.text || '쉼'}
                </Text>
                {l.tags.length > 0 && (
                  <View style={styles.rowTags}>
                    {l.tags.map((t) => (
                      <View key={`${t.kind}:${t.ref ?? ''}:${t.label}`} style={styles.rowTag}>
                        <Text style={styles.rowTagText}>{t.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.rowEnd}>
                <View style={[styles.logBar, { width: SIZE_BAR[l.size] }]} />
                <View style={styles.rowSize}>
                  <Text style={styles.rowSizeText}>{SIZE_LABEL[l.size]}</Text>
                  {isVisitLog(l) && (
                    <View style={styles.visitBadge}>
                      <Text style={styles.visitBadgeText}>{fireCopy.visitedBadge}</Text>
                    </View>
                  )}
                </View>
              </View>
              {l.id === freshId && <Sparkle />}
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyLog} />
          <Text style={styles.emptyTitle}>{fireCopy.emptyTitle}</Text>
          <Text style={styles.emptySub}>{fireCopy.emptySub}</Text>
        </View>
      )}
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
  card: { backgroundColor: colors.cardSub, borderRadius: 28, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16, alignItems: 'center', gap: 10 },
  fireText: { alignItems: 'center', gap: 4 },
  fireLine: { fontFamily: fonts.title, fontSize: 24, lineHeight: 30, textAlign: 'center' },
  fireSub: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textSub, textAlign: 'center' },
  throwBtn: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: '#C9A800',
  },
  throwPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  throwText: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.line },

  block: { gap: 8 },
  blockHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 6 },
  blockTitle: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  blockRange: { fontFamily: fonts.number, fontSize: 12, color: colors.textMuted },
  rows: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.cardSub, borderRadius: 20, paddingVertical: 12, paddingLeft: 10, paddingRight: 14, borderWidth: 3, borderColor: 'transparent' },
  rowFresh: { borderColor: colors.yellow },
  rowDate: { width: 42, alignItems: 'center', gap: 2 },
  rowDt: { fontFamily: fonts.numberBold, fontSize: 15, color: colors.text },
  rowDow: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textMuted },
  rowMid: { flex: 1, minWidth: 0, gap: 6 },
  rowText: { fontFamily: fonts.bodyHeavy, fontSize: 14, lineHeight: 19, color: colors.text },
  rowTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  rowTag: { height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: '#2E3775', justifyContent: 'center' },
  rowTagText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textSub },
  rowEnd: { alignItems: 'flex-end', gap: 5 },
  logBar: { height: 10, borderRadius: 5, backgroundColor: '#8E5A38', borderBottomWidth: 2, borderBottomColor: '#5A3420' },
  rowSize: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowSizeText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
  visitBadge: { height: 20, paddingHorizontal: 7, borderRadius: 10, backgroundColor: colors.relation, justifyContent: 'center' },
  visitBadgeText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.line },
  sparkle: { position: 'absolute', right: -6, top: -10, width: 30, height: 30 },
  empty: { borderRadius: 20, paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#2B3370' },
  emptyLog: { width: 44, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#4A5290' },
  emptyTitle: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  emptySub: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
  cards: { gap: 8, paddingHorizontal: 2, paddingTop: 10, paddingBottom: 2 },
  visitCard: { width: 124, backgroundColor: colors.cardSub, borderRadius: 20, padding: 12, gap: 4, borderWidth: 3, borderColor: 'transparent' },
  visitName: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
  visitDate: { fontFamily: fonts.number, fontSize: 12, color: colors.textMuted },
  visitStay: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
});
