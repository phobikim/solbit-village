// 꾸미기 — 솔이 옷 + 마을 배경. 탭이 아닌 전체 화면 (디자인 TURN 30·31). 들어오는 곳: 메인 코인 칸 · 솔이 · 나 탭 "꾸미기" 줄. 뒤로 가면 온 곳으로 돌아간다.
// 위에서 아래로: 헤더(뒤로 + 제목 + 지갑 알약) → 미리보기 카드 → [솔이 | 마을] 세그먼트 → (솔이 모드) 슬롯 탭 → 격자 → (하단 액션 버튼). 탭 바는 없다.
// 처음에는 항상 솔이가 열린다. 파일 이름은 라우트(/closet)를 그대로 두려고 바꾸지 않았다.
//
// 솔이 모드: 슬롯의 모든 옷을 보여 준다. 칸을 누르면 "선택"이 되고 미리보기에만 입혀진다 (저장 안 함, 슬롯마다 따로 유지, 화면을 벗어나면 초기화).
// 마을 모드: 카테고리는 배경 하나뿐이라 슬롯 탭 줄은 숨긴다 (VILLAGE_CATEGORIES가 둘 이상이 되면 나타난다). 2열 격자, 칸 4:3.
//   미리보기는 메인과 같은 장면(VillagePreview)에 현재 입은 옷의 솔이 + 고른 배경 테마.
// 하단 버튼은 선택한 것에 따라 구매하기 / 코인이 모자라요 / 갈아입기 / 착용 중 — 상태 결정은 domain/closet.ts getActionState · domain/villageBg.ts getBgActionState.
//   배경에는 "벗기"가 없다 (하나는 늘 적용 중이고, 되돌리려면 "기본"을 고른다).
// 옷 · 배경은 장식일 뿐이다 — 지수 · 레벨 · 작물 어떤 규칙에도 영향을 주지 않는다 (CLAUDE.md 규칙 2). 코인이 모자라도 벌은 없다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  ACTION_BUY,
  ACTION_EQUIP,
  ACTION_EQUIPPED,
  ACTION_SHORT,
  ACTION_TAKE_OFF,
  BUBBLE_BOUGHT,
  BUBBLE_DEFAULT,
  BUBBLE_NOT_OWNED,
  PREVIEW_RESET,
  SEGMENT_A11Y,
  SEGMENT_SOLI,
  SEGMENT_VILLAGE,
  VILLAGE_PREVIEW_LABEL,
} from '../src/copy/closet.ko';
import { CLOSET_PREVIEW_LABEL, CLOSET_TITLE, SLOT_LABEL } from '../src/copy/outfits.ko';
import { changeSlot, composePreview, EMPTY_PICK, getActionState, gridItems, isPreviewDirty, pickItem, syncPreview, type ActionState } from '../src/domain/closet';
import { timeOfDayAt } from '../src/domain/day';
import { itemMeta, SLOTS, type Slot } from '../src/domain/outfit';
import { priceOf } from '../src/domain/shop';
import {
  bgItemsOf,
  EMPTY_BG_PICK,
  getBgActionState,
  isBgPreviewDirty,
  pickBg,
  priceOfBg,
  shownBg,
  syncBgPreview,
  VILLAGE_CATEGORIES,
} from '../src/domain/villageBg';
import { formatCount } from '../src/domain/wallet';
import { useOutfit } from '../src/state/outfit';
import { useVillageBg } from '../src/state/villageBg';
import { useWallet } from '../src/state/wallet';
import { Ijang } from '../src/ui/characters';
import { ChunkyButton, CHUNKY_DROP, CHUNKY_HEIGHT } from '../src/ui/components/ChunkyButton';
import { ClosetCell } from '../src/ui/components/ClosetGrid';
import { ClosetStage } from '../src/ui/components/ClosetStage';
import { VillageCell } from '../src/ui/components/VillageGrid';
import { VillagePreview } from '../src/ui/components/VillagePreview';
import { WalletPill } from '../src/ui/components/WalletPill';
import { APP_MAX_WIDTH, CLOSET_LAYOUT } from '../src/ui/layout';
import { colors, fonts } from '../src/ui/theme';

const L = CLOSET_LAYOUT;

type Segment = 'soli' | 'village';

/** 뒤로: 온 곳으로. 바로 열었으면 마을로 */
const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** 슬롯 탭 아이콘 (시안 옷장 파일의 SLOTS 상수 그대로) */
const SLOT_ICON: Record<Slot, readonly string[]> = {
  head: ['M3 17h18', 'M6.5 17c0-6 2.5-10 5.5-10s5.5 4 5.5 10'],
  face: ['M3 12a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', 'M14 12a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0-7 0', 'M10 11.5q2-1.5 4 0'],
  body: ['M8.5 4L4 7l2 4 2-1v10h8V10l2 1 2-4-4.5-3c-.8 1.8-2 2.8-3.5 2.8S9.3 5.8 8.5 4z'],
  back: ['M6.5 9a5.5 5.5 0 0 1 11 0v10.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z', 'M10 4.2V3h4v1.2', 'M9.5 14h5v3h-5z'],
  hand: ['M7 9h9v8a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3z', 'M16 11h1.5a2 2 0 0 1 0 4H16', 'M9.5 3.5v2.5', 'M13 3.5v2.5'],
  feet: ['M7.5 3.5h5v8l5.5 2a2.5 2.5 0 0 1 2 2.5v2.5H6.5V4.5a1 1 0 0 1 1-1z', 'M6.5 16h13.5'],
};

/** 마을 카테고리 이름 (카테고리가 둘 이상일 때만 탭 줄이 나온다) */
const VILLAGE_CATEGORY_LABEL = { bg: '배경' } as const;

export default function ClosetScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const frameWidth = Math.min(windowWidth, APP_MAX_WIDTH);

  const coin = useWallet((s) => s.coin);
  const loadWallet = useWallet((s) => s.load);
  const owned = useOutfit((s) => s.owned);
  const equipped = useOutfit((s) => s.equipped);
  const loadOutfit = useOutfit((s) => s.load);
  const toggle = useOutfit((s) => s.toggle);
  const buy = useOutfit((s) => s.buy);
  const bgOwned = useVillageBg((s) => s.owned);
  const bgEquipped = useVillageBg((s) => s.equipped);
  const loadBg = useVillageBg((s) => s.load);
  const equipBg = useVillageBg((s) => s.equip);
  const buyBg = useVillageBg((s) => s.buy);

  const [segment, setSegment] = useState<Segment>('soli');
  const [slot, setSlot] = useState<Slot>('head');
  const [pick, setPick] = useState(EMPTY_PICK);
  const [bgPick, setBgPick] = useState(EMPTY_BG_PICK);
  const [category, setCategory] = useState(VILLAGE_CATEGORIES[0]);
  /** 방금 산 것 (별이 반짝인다) */
  const [just, setJust] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const buying = useRef(false);
  const timeOfDay = useMemo(() => timeOfDayAt(new Date()), []);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadOutfit(), loadBg(), loadWallet()]).catch((e) => console.warn('[closet] load failed', e));
      // 화면을 벗어나면 미리보기는 초기화한다
      return () => {
        setPick(EMPTY_PICK);
        setBgPick(EMPTY_BG_PICK);
        setJust(null);
      };
    }, [loadOutfit, loadBg, loadWallet]),
  );

  const villageMode = segment === 'village';

  // ── 솔이 모드 ──
  const selectedMeta = pick.selected ? itemMeta(pick.selected) : undefined;
  const soliAction = selectedMeta ? getActionState(selectedMeta, { owned, equipped, coins: coin }) : null;
  const preview = useMemo(() => composePreview(equipped, pick.preview), [equipped, pick.preview]);
  const soliDirty = isPreviewDirty(equipped, pick.preview);

  // ── 마을 모드 ──
  const bgAction = bgPick.selected ? getBgActionState(bgPick.selected, { owned: bgOwned, equipped: bgEquipped, coins: coin }) : null;
  const shownBackground = shownBg(bgEquipped, bgPick.preview);
  const bgDirty = isBgPreviewDirty(bgEquipped, bgPick.preview);

  const action: ActionState | null = villageMode ? bgAction : soliAction;
  const dirty = villageMode ? bgDirty : soliDirty;

  const onSegment = (s: Segment) => {
    setSegment(s);
    setJust(null);
  };

  const onPick = (id: string) => {
    setJust(null);
    setPick((cur) => pickItem(cur, id, equipped));
  };
  const onPickBg = (id: string) => {
    setJust(null);
    setBgPick((cur) => pickBg(cur, id, bgEquipped));
  };
  const onSlot = (s: Slot) => {
    setSlot(s);
    setPick(changeSlot);
  };
  const onReset = () => {
    setJust(null);
    if (villageMode) setBgPick(EMPTY_BG_PICK);
    else setPick(EMPTY_PICK);
  };

  const onEquip = () => {
    if (villageMode) {
      if (!bgPick.selected) return;
      equipBg(bgPick.selected);
      setBgPick((cur) => ({ ...cur, preview: syncBgPreview(cur.preview, cur.selected ?? bgEquipped) }));
      return;
    }
    if (!selectedMeta) return;
    toggle(selectedMeta.id);
    setPick((cur) => ({ ...cur, preview: syncPreview(cur.preview, { ...equipped, [selectedMeta.slot]: selectedMeta.id }) }));
  };
  const onTakeOff = () => {
    if (!selectedMeta) return;
    toggle(selectedMeta.id);
    setPick((cur) => ({ selected: null, preview: syncPreview(cur.preview, { ...equipped, [selectedMeta.slot]: undefined }) }));
  };
  const onBuy = async () => {
    if (buying.current) return;
    buying.current = true;
    setBusy(true);
    try {
      if (villageMode) {
        const id = bgPick.selected;
        if (!id) return;
        const r = await buyBg(id);
        if (r.ok) {
          setJust(id);
          setBgPick((cur) => ({ ...cur, preview: syncBgPreview(cur.preview, useVillageBg.getState().equipped) }));
        }
        return;
      }
      if (!selectedMeta) return;
      const r = await buy(selectedMeta.id);
      if (r.ok) {
        setJust(selectedMeta.id);
        setPick((cur) => ({ ...cur, preview: syncPreview(cur.preview, { ...useOutfit.getState().equipped }) }));
      }
    } finally {
      buying.current = false;
      setBusy(false);
    }
  };

  const cells = gridItems(slot).map((it) => ({
    id: it.id,
    wearing: equipped[slot] === it.id,
    selected: pick.selected === it.id,
    owned: owned.has(it.id),
    price: priceOf(it.id) ?? 0,
    short: !owned.has(it.id) && (priceOf(it.id) ?? 0) > coin,
    just: just === it.id,
  }));
  const bgCells = bgItemsOf(category).map((b) => ({
    id: b.id,
    wearing: bgEquipped === b.id,
    selected: bgPick.selected === b.id,
    owned: bgOwned.has(b.id),
    price: priceOfBg(b.id) ?? 0,
    short: !bgOwned.has(b.id) && (priceOfBg(b.id) ?? 0) > coin,
    just: just === b.id,
  }));

  const gridInnerWidth = frameWidth - L.grid.side * 2;
  const cols = villageMode ? 2 : L.grid.cols;
  const cellWidth = (gridInnerWidth - L.grid.gapX * (cols - 1)) / cols;
  const previewWidth = frameWidth - L.preview.side * 2;
  const say = just ? BUBBLE_BOUGHT : action && (action.kind === 'buy' || action.kind === 'short') ? BUBBLE_NOT_OWNED : BUBBLE_DEFAULT;

  const bubble = (
    <View style={styles.bubbleRow} pointerEvents="none">
      <View style={styles.avatar}>
        <Ijang mood="base" size={34} style={{ marginTop: 1 }} />
      </View>
      <View style={styles.bubble}>
        <Text style={styles.bubbleText}>{say}</Text>
      </View>
    </View>
  );
  const resetChip = dirty && (
    <Pressable accessibilityRole="button" accessibilityLabel={PREVIEW_RESET} onPress={onReset} style={styles.resetChip}>
      <Text style={styles.resetText}>{PREVIEW_RESET}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로" onPress={goBack} hitSlop={6} style={styles.back}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M15 5l-7 7 7 7" />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{CLOSET_TITLE}</Text>
        <WalletPill variant="header" />
      </View>

      <View style={styles.previewSlot} accessible accessibilityLabel={villageMode ? VILLAGE_PREVIEW_LABEL : CLOSET_PREVIEW_LABEL}>
        {villageMode ? (
          <VillagePreview width={previewWidth} height={L.preview.height} radius={L.preview.radius} bgId={shownBackground} timeOfDay={timeOfDay} equipped={equipped}>
            {bubble}
            {resetChip}
          </VillagePreview>
        ) : (
          <ClosetStage variant="main" width={previewWidth} equipped={preview}>
            {bubble}
            {resetChip}
          </ClosetStage>
        )}
      </View>

      <View style={styles.segment} accessibilityRole="tablist" accessibilityLabel={SEGMENT_A11Y}>
        {(
          [
            ['soli', SEGMENT_SOLI],
            ['village', SEGMENT_VILLAGE],
          ] as const
        ).map(([k, label]) => (
          <Pressable
            key={k}
            accessibilityRole="tab"
            accessibilityState={{ selected: segment === k }}
            accessibilityLabel={label}
            onPress={() => onSegment(k)}
            style={[styles.segmentCell, segment === k && styles.segmentCellOn]}
          >
            <Text style={[styles.segmentText, { color: segment === k ? colors.line : colors.textSub }]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {!villageMode && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
          {SLOTS.map((s) => (
            <SlotTab key={s} slot={s} on={s === slot} onPress={onSlot} />
          ))}
        </ScrollView>
      )}
      {villageMode && VILLAGE_CATEGORIES.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
          {VILLAGE_CATEGORIES.map((c) => (
            <Pressable key={c} accessibilityRole="tab" accessibilityState={{ selected: c === category }} onPress={() => setCategory(c)} style={[styles.slotTab, c === category && styles.slotTabOn]}>
              <Text style={[styles.slotLabel, { color: c === category ? colors.line : colors.textSub, paddingLeft: 4 }]}>{VILLAGE_CATEGORY_LABEL[c]}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.grid}
        contentContainerStyle={[styles.gridContent, { paddingBottom: (action ? L.grid.bottomWithAction : L.grid.bottom) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {villageMode
          ? bgCells.map((c) => <VillageCell key={c.id} {...c} width={cellWidth} timeOfDay={timeOfDay} reduceMotion={reduceMotion} onPress={onPickBg} />)
          : cells.map((c) => <ClosetCell key={c.id} {...c} width={cellWidth} reduceMotion={reduceMotion} onPress={onPick} />)}
      </ScrollView>

      {action && (
        <View style={[styles.actionSlot, { bottom: insets.bottom + L.action.bottom - CHUNKY_DROP }]} pointerEvents="box-none">
          {/* 벗기는 옷에만 있다. 배경은 하나가 늘 적용 중이라 벗는 길이 없다 */}
          {action.kind === 'equipped' && !villageMode && (
            <View style={{ width: L.action.takeOffWidth, height: CHUNKY_HEIGHT + CHUNKY_DROP }}>
              <View style={styles.takeOffUnder} />
              <Pressable accessibilityRole="button" accessibilityLabel={ACTION_TAKE_OFF} onPress={onTakeOff} style={({ pressed }) => [styles.takeOff, { marginBottom: 0 }, pressed && { transform: [{ translateY: 3 }] }]}>
                <Text style={styles.takeOffText}>{ACTION_TAKE_OFF}</Text>
              </Pressable>
            </View>
          )}
          <View style={{ flex: 1 }}>
            {action.kind === 'buy' && <ChunkyButton label={ACTION_BUY(formatCount(action.price))} onPress={onBuy} disabled={busy} />}
            {action.kind === 'short' && (
              <ChunkyButton label={ACTION_SHORT(formatCount(action.lack))} onPress={() => {}} disabled bg="#1E2558" ink={colors.textMuted} drop="transparent" ring="#2B3370" />
            )}
            {action.kind === 'equip' && <ChunkyButton label={ACTION_EQUIP} onPress={onEquip} bg={colors.yellow} drop="#C9A800" />}
            {action.kind === 'equipped' && (
              <ChunkyButton
                label={ACTION_EQUIPPED}
                onPress={() => {}}
                disabled
                bg="#1E2558"
                ink={colors.textSub}
                drop="transparent"
                ring="#2B3370"
                leading={
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.yellow} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 12.5l4.5 4.5L19 7.5" />
                  </Svg>
                }
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function SlotTab({ slot, on, onPress }: { slot: Slot; on: boolean; onPress: (s: Slot) => void }) {
  const ink = on ? colors.line : colors.textSub;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={SLOT_LABEL[slot]}
      onPress={() => onPress(slot)}
      style={[styles.slotTab, on && styles.slotTabOn]}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        {SLOT_ICON[slot].map((d) => (
          <Path key={d} d={d} />
        ))}
      </Svg>
      <Text style={[styles.slotLabel, { color: ink }]}>{SLOT_LABEL[slot]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  header: {
    paddingTop: L.header.top,
    paddingBottom: L.header.bottom,
    paddingHorizontal: 16,
    height: L.header.top + L.header.height + L.header.bottom,
    minHeight: 40 + L.header.top + L.header.bottom,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: fonts.title, fontSize: 22, color: colors.yellow },
  previewSlot: { flexShrink: 0, marginHorizontal: L.preview.side, height: L.preview.height },
  bubbleRow: { position: 'absolute', left: 12, top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.yellow,
    overflow: 'hidden',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.line,
  },
  bubble: { flexShrink: 1, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, borderRadius: 14, paddingVertical: 5, paddingHorizontal: 11 },
  bubbleText: { fontFamily: fonts.bodyHeavy, fontSize: 13, lineHeight: 17, color: colors.text },
  resetChip: { position: 'absolute', right: 12, bottom: 12, height: 30, paddingHorizontal: 14, borderRadius: 15, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.line, justifyContent: 'center' },
  resetText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.text },
  // [솔이 | 마을] 세그먼트: 높이 44, 배경 #1E2558, 둥글기 22, 안쪽 4, 칸 사이 4
  segment: { flexShrink: 0, marginTop: 12, marginHorizontal: 12, height: 44, padding: 4, borderRadius: 22, backgroundColor: colors.cardSub, flexDirection: 'row', gap: 4 },
  segmentCell: { flex: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  segmentCellOn: { backgroundColor: colors.yellow },
  segmentText: { fontFamily: fonts.bodyHeavy, fontSize: 15 },
  tabsScroll: { flexGrow: 0, flexShrink: 0, marginTop: L.tabs.top },
  tabs: { paddingHorizontal: L.tabs.side, gap: L.tabs.gap },
  slotTab: {
    height: L.tabs.height,
    paddingLeft: 10,
    paddingRight: 14,
    borderRadius: 18,
    backgroundColor: colors.cardSub,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  slotTabOn: { backgroundColor: colors.yellow },
  slotLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13 },
  grid: { flex: 1 },
  gridContent: {
    paddingTop: L.grid.top,
    paddingHorizontal: L.grid.side,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: L.grid.gapX,
    rowGap: L.grid.gapY,
    alignContent: 'flex-start',
  },
  actionSlot: {
    position: 'absolute',
    left: L.action.side,
    right: L.action.side,
    height: CHUNKY_HEIGHT + CHUNKY_DROP,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: L.action.gap,
  },
  takeOff: {
    width: L.action.takeOffWidth,
    height: CHUNKY_HEIGHT,
    borderRadius: CHUNKY_HEIGHT / 2,
    backgroundColor: '#2B3370',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: CHUNKY_DROP,
  },
  takeOffUnder: { position: 'absolute', left: 0, top: CHUNKY_DROP, width: L.action.takeOffWidth, height: CHUNKY_HEIGHT, borderRadius: CHUNKY_HEIGHT / 2, backgroundColor: '#1A2050' },
  takeOffText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.text },
});
