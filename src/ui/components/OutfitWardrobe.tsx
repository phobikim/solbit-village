// 복장 고르기의 옷장 (디자인 26c~f): 옷걸이 봉 · 슬롯 탭 6개 · 아이템 격자(4열 × 2행, 넘으면 가로 페이지) · 페이지 점.
// 첫 칸은 "없음"(그 슬롯을 벗는다). 아직 없는 옷은 실루엣 + 자물쇠로 보이고 눌러도 입히지 않는다. 가격은 보여 주지 않는다.

import { memo, useCallback, useRef, useState, type ElementRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { OUTFIT_LOCKED_SUFFIX, OUTFIT_NAME, OUTFIT_NONE, OUTFIT_PAGE, SLOT_LABEL } from '../../copy/outfits.ko';
import { SLOTS, isOwned, itemsOfSlot, type Equipped, type Slot } from '../../domain/outfit';
import { dressedThumbBox, itemThumbBox } from '../characters/outfits';
import { SoliOutfit } from '../characters/SoliOutfit';
import { OUTFIT_LAYOUT } from '../layout';
import { colors, fonts } from '../theme';

type ScrollViewRef = ElementRef<typeof ScrollView>;

const L = OUTFIT_LAYOUT;
const WOOD = '#8A5A3C';
const COLS = 4;
const PER_PAGE = 8;
const SILHOUETTE = '#2E3672';

const SLOT_ICON: Record<Slot, readonly string[]> = {
  head: ['M3 17h18', 'M6.5 17c0-6 2.5-10 5.5-10s5.5 4 5.5 10'],
  face: ['M3 12a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', 'M14 12a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', 'M10 11.5q2-1.5 4 0'],
  body: ['M8.5 4L4 7l2 4 2-1v10h8V10l2 1 2-4-4.5-3c-.8 1.8-2 2.8-3.5 2.8S9.3 5.8 8.5 4z'],
  back: ['M6.5 9a5.5 5.5 0 0 1 11 0v10.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z', 'M10 4.2V3h4v1.2', 'M9.5 14h5v3h-5z'],
  hand: ['M7 9h9v8a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3z', 'M16 11h1.5a2 2 0 0 1 0 4H16', 'M9.5 3.5v2.5', 'M13 3.5v2.5'],
  feet: ['M7.5 3.5h5v8l5.5 2a2.5 2.5 0 0 1 2 2.5v2.5H6.5V4.5a1 1 0 0 1 1-1z', 'M6.5 16h13.5'],
};

type Props = {
  slot: Slot;
  onSlot: (s: Slot) => void;
  /** 지금 화면에서 입고 있는 모습 */
  equipped: Equipped;
  owned: ReadonlySet<string>;
  /** 아이템 칸을 눌렀다 */
  onPick: (itemId: string) => void;
  /** "없음" 칸을 눌렀다 */
  onNone: (slot: Slot) => void;
  /** 격자 한 페이지의 너비 */
  pageWidth: number;
  tabHeight: number;
  cellHeight: number;
};

export function OutfitWardrobe({ slot, onSlot, equipped, owned, onPick, onNone, pageWidth, tabHeight, cellHeight }: Props) {
  return (
    <View>
      <View style={styles.rod}>
        <View style={[styles.rodEnd, { left: 0 }]} />
        <View style={[styles.rodEnd, { right: 0 }]} />
        <View style={styles.rodBar} />
      </View>
      <View style={styles.tabs}>
        {SLOTS.map((s) => (
          <View key={s} style={styles.tabCol}>
            <View style={styles.stick} />
            <SlotTab slot={s} on={s === slot} height={tabHeight} onPress={onSlot} />
          </View>
        ))}
      </View>
      <Grid
        key={slot}
        slot={slot}
        equipped={equipped}
        owned={owned}
        onPick={onPick}
        onNone={onNone}
        pageWidth={pageWidth}
        cellHeight={cellHeight}
      />
    </View>
  );
}

const SlotTab = memo(function SlotTab({ slot, on, height, onPress }: { slot: Slot; on: boolean; height: number; onPress: (s: Slot) => void }) {
  const ink = on ? colors.line : colors.textSub;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={SLOT_LABEL[slot]}
      onPress={() => onPress(slot)}
      style={[styles.tab, { height }, on && styles.tabOn]}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {SLOT_ICON[slot].map((d) => (
          <Path key={d} d={d} />
        ))}
      </Svg>
      <Text style={[styles.tabLabel, { color: ink }]}>{SLOT_LABEL[slot]}</Text>
    </Pressable>
  );
});

type CellSpec = { kind: 'none' } | { kind: 'item'; id: string } | { kind: 'locked'; id: string };

function Grid({ slot, equipped, owned, onPick, onNone, pageWidth, cellHeight }: Omit<Props, 'onSlot' | 'tabHeight'>) {
  const ref = useRef<ScrollViewRef>(null);
  const [page, setPage] = useState(0);

  const cells: CellSpec[] = [{ kind: 'none' }];
  for (const it of itemsOfSlot(slot)) cells.push(isOwned(owned, it.id) ? { kind: 'item', id: it.id } : { kind: 'locked', id: it.id });
  const pages: CellSpec[][] = [];
  for (let i = 0; i < cells.length; i += PER_PAGE) pages.push(cells.slice(i, i + PER_PAGE));

  const cellWidth = (pageWidth - L.pagerPad - L.cellGap * (COLS - 1)) / COLS;
  const current = equipped[slot];

  const onEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth)),
    [pageWidth],
  );
  const goTo = (p: number) => {
    setPage(p);
    ref.current?.scrollTo({ x: p * pageWidth, animated: true });
  };

  return (
    <>
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        scrollEnabled={pages.length > 1}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
        style={[styles.pager, { height: L.pagerPad + cellHeight * 2 + L.cellGap }]}
      >
        {pages.map((cs, p) => (
          <View key={p} style={[styles.page, { width: pageWidth }]}>
            {cs.map((c) => (
              <Cell
                key={c.kind === 'none' ? 'none' : c.id}
                spec={c}
                slot={slot}
                on={c.kind === 'none' ? current === undefined : c.kind === 'item' && current === c.id}
                width={cellWidth}
                height={cellHeight}
                onPick={onPick}
                onNone={onNone}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {pages.length > 1 &&
          pages.map((_, p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              accessibilityLabel={`${OUTFIT_PAGE} ${p + 1}`}
              hitSlop={10}
              onPress={() => goTo(p)}
              style={[styles.dot, p === page && styles.dotOn]}
            />
          ))}
      </View>
    </>
  );
}

type CellProps = {
  spec: CellSpec;
  slot: Slot;
  on: boolean;
  width: number;
  height: number;
  onPick: (itemId: string) => void;
  onNone: (slot: Slot) => void;
};

/** 칸 하나. 같은 칸을 다시 그리지 않게 memo (입은 옷이 바뀌면 그 슬롯 칸의 선택 표시만 바뀐다) */
const Cell = memo(function Cell({ spec, slot, on, width, height, onPick, onNone }: CellProps) {
  const thumb = Math.min(60, height - 6);
  const locked = spec.kind === 'locked';
  const label = spec.kind === 'none' ? OUTFIT_NONE : OUTFIT_NAME[spec.id] + (locked ? OUTFIT_LOCKED_SUFFIX : '');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on, disabled: locked }}
      disabled={locked}
      onPress={() => (spec.kind === 'none' ? onNone(slot) : onPick(spec.id))}
      style={[styles.cell, { width, height }]}
    >
      {spec.kind === 'none' && (
        <Svg width={30} height={30} viewBox="0 0 30 30" fill="none" stroke={colors.textMuted} strokeWidth={3} strokeLinecap="round">
          <Circle cx={15} cy={15} r={11} />
          <Path d="M7.5 22.5L22.5 7.5" />
        </Svg>
      )}
      {spec.kind === 'item' && (
        <SoliOutfit equipped={{ [slot]: spec.id }} box={dressedThumbBox(spec.id, thumb)} style={{ width: thumb, height: thumb }} />
      )}
      {spec.kind === 'locked' && (
        <>
          <SoliOutfit equipped={{ [slot]: spec.id }} box={itemThumbBox(spec.id, 48)} silhouette={SILHOUETTE} style={{ width: 48, height: 48 }} />
          <View style={styles.lock}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.8} strokeLinecap="round">
              <Rect x={5} y={11} width={14} height={10} rx={2.5} fill={colors.textMuted} />
              <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </Svg>
          </View>
        </>
      )}
      {on && <View pointerEvents="none" style={styles.ring} />}
      {on && (
        <View pointerEvents="none" style={styles.check}>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 12.5l4.5 4.5L19 7.5" />
          </Svg>
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  rod: { height: L.rod, marginHorizontal: 2 },
  rodEnd: { position: 'absolute', top: 0, width: 10, height: 10, borderRadius: 3, backgroundColor: '#5E3C28' },
  rodBar: { position: 'absolute', left: 6, right: 6, top: 2, height: 6, borderRadius: 3, backgroundColor: WOOD },
  tabs: { flexDirection: 'row', gap: 5 },
  tabCol: { flex: 1, alignItems: 'center' },
  stick: { width: 2, height: L.tabStick, backgroundColor: WOOD },
  tab: { alignSelf: 'stretch', borderRadius: 14, backgroundColor: colors.cardSub, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabOn: { backgroundColor: colors.yellow },
  tabLabel: { fontFamily: fonts.bodyHeavy, fontSize: 11, lineHeight: 12 },
  pager: { flexGrow: 0, marginTop: L.gapPager - 0 },
  page: { flexDirection: 'row', flexWrap: 'wrap', gap: L.cellGap, paddingTop: L.pagerPad, paddingRight: L.pagerPad },
  cell: { borderRadius: 16, backgroundColor: colors.cardSub, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 16, borderWidth: 3, borderColor: colors.yellow },
  check: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.card,
  },
  lock: { position: 'absolute', right: 7, bottom: 7, width: 20, height: 20, borderRadius: 7, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center' },
  dots: { height: L.dots, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.disabled },
  dotOn: { width: 18, backgroundColor: colors.yellow },
});
