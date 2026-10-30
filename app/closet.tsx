// 솔이 옷장 — 탭이 아닌 전체 화면 (디자인 TURN 30). 들어오는 곳: 메인 코인 칸 · 솔이 · 나 탭 "솔이 옷장" 줄. 뒤로 가면 온 곳으로 돌아간다.
// 위에서 아래로: 헤더(뒤로 + 제목 + 지갑 알약) → 미리보기 카드 → 슬롯 탭 → 3열 격자 → (하단 액션 버튼). 탭 바는 없다.
// 슬롯의 모든 옷을 보여 준다. 칸을 누르면 "선택"이 되고 미리보기에만 입혀진다 (저장 안 함, 슬롯마다 따로 유지, 탭을 벗어나면 초기화).
// 하단 버튼은 선택한 옷에 따라 구매하기 / 코인이 모자라요 / 갈아입기 / 착용 중 — 상태 결정은 domain/closet.ts getActionState.
// 옷은 장식일 뿐이다 — 지수 · 레벨 · 작물 어떤 규칙에도 영향을 주지 않는다 (CLAUDE.md 규칙 2). 코인이 모자라도 벌은 없다.

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
} from '../src/copy/closet.ko';
import { CLOSET_PREVIEW_LABEL, CLOSET_TITLE, SLOT_LABEL } from '../src/copy/outfits.ko';
import { changeSlot, composePreview, EMPTY_PICK, getActionState, gridItems, isPreviewDirty, pickItem, syncPreview } from '../src/domain/closet';
import { itemMeta, SLOTS, type Slot } from '../src/domain/outfit';
import { priceOf } from '../src/domain/shop';
import { formatCount } from '../src/domain/wallet';
import { useOutfit } from '../src/state/outfit';
import { useWallet } from '../src/state/wallet';
import { Ijang } from '../src/ui/characters';
import { ChunkyButton, CHUNKY_DROP, CHUNKY_HEIGHT } from '../src/ui/components/ChunkyButton';
import { ClosetCell } from '../src/ui/components/ClosetGrid';
import { ClosetStage } from '../src/ui/components/ClosetStage';
import { WalletPill } from '../src/ui/components/WalletPill';
import { HangerIcon } from '../src/ui/components/HangerIcon';
import { APP_MAX_WIDTH, CLOSET_LAYOUT } from '../src/ui/layout';
import { colors, fonts } from '../src/ui/theme';

const L = CLOSET_LAYOUT;

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

  const [slot, setSlot] = useState<Slot>('head');
  const [pick, setPick] = useState(EMPTY_PICK);
  /** 방금 산 옷 (별이 반짝인다) */
  const [just, setJust] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const buying = useRef(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadOutfit(), loadWallet()]).catch((e) => console.warn('[closet] load failed', e));
      // 탭을 벗어나면 미리보기는 초기화한다
      return () => {
        setPick(EMPTY_PICK);
        setJust(null);
      };
    }, [loadOutfit, loadWallet]),
  );

  const selectedMeta = pick.selected ? itemMeta(pick.selected) : undefined;
  const action = selectedMeta ? getActionState(selectedMeta, { owned, equipped, coins: coin }) : null;
  const preview = useMemo(() => composePreview(equipped, pick.preview), [equipped, pick.preview]);
  const dirty = isPreviewDirty(equipped, pick.preview);

  const onPick = (id: string) => {
    setJust(null);
    setPick((cur) => pickItem(cur, id, equipped));
  };
  const onSlot = (s: Slot) => {
    setSlot(s);
    setPick(changeSlot);
  };
  const onReset = () => {
    setJust(null);
    setPick(EMPTY_PICK);
  };

  const onEquip = () => {
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
    if (!selectedMeta || buying.current) return;
    buying.current = true;
    setBusy(true);
    try {
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

  const gridInnerWidth = frameWidth - L.grid.side * 2;
  const cellWidth = (gridInnerWidth - L.grid.gapX * (L.grid.cols - 1)) / L.grid.cols;
  const previewWidth = frameWidth - L.preview.side * 2;
  const say = just ? BUBBLE_BOUGHT : action && (action.kind === 'buy' || action.kind === 'short') ? BUBBLE_NOT_OWNED : BUBBLE_DEFAULT;

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

      <View style={styles.previewSlot} accessible accessibilityLabel={CLOSET_PREVIEW_LABEL}>
        <ClosetStage variant="main" width={previewWidth} equipped={preview}>
          <View style={styles.bubbleRow} pointerEvents="none">
            <View style={styles.avatar}>
              <Ijang mood="base" size={34} style={{ marginTop: 1 }} />
            </View>
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>{say}</Text>
            </View>
          </View>
          {dirty && (
            <Pressable accessibilityRole="button" accessibilityLabel={PREVIEW_RESET} onPress={onReset} style={styles.resetChip}>
              <Text style={styles.resetText}>{PREVIEW_RESET}</Text>
            </Pressable>
          )}
        </ClosetStage>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {SLOTS.map((s) => (
          <SlotTab key={s} slot={s} on={s === slot} onPress={onSlot} />
        ))}
      </ScrollView>

      <ScrollView
        style={styles.grid}
        contentContainerStyle={[styles.gridContent, { paddingBottom: (action ? L.grid.bottomWithAction : L.grid.bottom) + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {cells.map((c) => (
          <ClosetCell key={c.id} {...c} width={cellWidth} reduceMotion={reduceMotion} onPress={onPick} />
        ))}
      </ScrollView>

      {action && (
        <View style={[styles.actionSlot, { bottom: insets.bottom + L.action.bottom - CHUNKY_DROP }]} pointerEvents="box-none">
          {action.kind === 'equipped' && (
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
