// 솔이 옷장 탭 (디자인 TURN 28). 위에서 아래로: 헤더(재화 칩 + 제목) → 미리보기 카드 → [내 옷장 | 옷 가게] → 슬롯 탭 → 3열 격자 → (사기 버튼) → 탭 바.
// 내 옷장: 가진 옷만. 칸을 누르면 바로 입고 벗고 즉시 저장된다 (슬롯마다 한 벌).
// 옷 가게: 모든 옷. 칸을 누르면 미리보기에만 입혀 본다 (저장 안 함). 안 가진 옷을 입어 보는 중이면 "사기 · 가격" 버튼이 뜨고, 시트에서 확인 후 산다.
// 옷은 장식일 뿐이다 — 지수 · 레벨 · 작물 어떤 규칙에도 영향을 주지 않는다 (CLAUDE.md 규칙 2). 코인이 모자라도 벌은 없다.

import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import {
  BUBBLE_BOUGHT,
  BUBBLE_CLOSET,
  BUBBLE_SHOP,
  buyButtonLabel,
  CLOSET_PREVIEW_LABEL,
  CLOSET_TITLE,
  GO_SHOP,
  SEGMENT_CLOSET,
  SEGMENT_SHOP,
  SLOT_LABEL,
} from '../../src/copy/outfits.ko';
import { itemMeta, itemsOfSlot, SLOTS, type Equipped, type Slot } from '../../src/domain/outfit';
import { priceOf } from '../../src/domain/shop';
import { formatCount, shortBy } from '../../src/domain/wallet';
import { useOutfit } from '../../src/state/outfit';
import { useWallet } from '../../src/state/wallet';
import { Ijang } from '../../src/ui/characters';
import { BuySheet } from '../../src/ui/components/BuySheet';
import { ChunkyButton, CHUNKY_DROP, CHUNKY_HEIGHT } from '../../src/ui/components/ChunkyButton';
import { ClosetCell, GoShopCell, type CellView } from '../../src/ui/components/ClosetGrid';
import { ClosetStage } from '../../src/ui/components/ClosetStage';
import { CurrencyChips } from '../../src/ui/components/CurrencyChips';
import { APP_MAX_WIDTH, CLOSET_LAYOUT } from '../../src/ui/layout';
import { colors, fonts } from '../../src/ui/theme';

const L = CLOSET_LAYOUT;

type View_ = 'closet' | 'shop';

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

  const [view, setView] = useState<View_>('closet');
  const [slot, setSlot] = useState<Slot>('head');
  /** 옷 가게에서 입어 보는 중인 옷 (저장 안 함) */
  const [tryOn, setTryOn] = useState<string | null>(null);
  /** 방금 산 옷 (별이 반짝인다) */
  const [just, setJust] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadOutfit(), loadWallet()]).catch((e) => console.warn('[closet] load failed', e));
    }, [loadOutfit, loadWallet]),
  );

  const shop = view === 'shop';
  const buyable = shop && tryOn !== null && !owned.has(tryOn);
  const tryPrice = buyable ? priceOf(tryOn) ?? 0 : 0;
  const tryLack = buyable ? shortBy(coin, tryPrice) : 0;

  // 미리보기: 입고 있는 옷 + (가게에서) 입어 보는 옷
  const preview = useMemo<Equipped>(() => {
    const meta = shop && tryOn ? itemMeta(tryOn) : undefined;
    return meta && tryOn ? { ...equipped, [meta.slot]: tryOn } : equipped;
  }, [equipped, shop, tryOn]);

  const goCloset = () => {
    setView('closet');
    setTryOn(null);
    setJust(null);
    setSheetOpen(false);
  };
  const goShop = () => {
    setView('shop');
    setJust(null);
  };

  const onPick = useCallback(
    (id: string) => {
      setJust(null);
      if (view === 'closet') toggle(id);
      else setTryOn((cur) => (cur === id ? null : id));
    },
    [view, toggle],
  );

  const onBuy = async (id: string) => {
    const r = await buy(id);
    setSheetOpen(false);
    if (r.ok) {
      setTryOn(null);
      setJust(id);
    }
  };

  const cells: CellView[] = itemsOfSlot(slot)
    .filter((it) => shop || owned.has(it.id))
    .map((it) => {
      const has = owned.has(it.id);
      const price = shop && !has ? priceOf(it.id) ?? 0 : null;
      return {
        id: it.id,
        wearing: !shop && equipped[slot] === it.id,
        tryOn: shop && tryOn === it.id,
        owned: shop && has,
        price,
        lack: price !== null ? shortBy(coin, price) : 0,
        just: just === it.id,
      };
    });

  const gridInnerWidth = frameWidth - L.grid.side * 2;
  const cellWidth = (gridInnerWidth - L.grid.gapX * (L.grid.cols - 1)) / L.grid.cols;
  const previewWidth = frameWidth - L.preview.side * 2;
  const say = just ? BUBBLE_BOUGHT : shop ? BUBBLE_SHOP : BUBBLE_CLOSET;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <CurrencyChips />
        <Text style={styles.title}>{CLOSET_TITLE}</Text>
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
        </ClosetStage>
      </View>

      <View style={styles.segment} accessibilityRole="tablist">
        <SegmentButton label={SEGMENT_CLOSET} on={!shop} onPress={goCloset} />
        <SegmentButton label={SEGMENT_SHOP} on={shop} onPress={goShop} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
        {SLOTS.map((s) => (
          <SlotTab key={s} slot={s} on={s === slot} onPress={setSlot} />
        ))}
      </ScrollView>

      <ScrollView
        style={styles.grid}
        contentContainerStyle={[styles.gridContent, { paddingBottom: buyable ? L.grid.bottomWithBuy : L.grid.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {cells.map((c) => (
          <ClosetCell key={c.id} {...c} width={cellWidth} reduceMotion={reduceMotion} onPress={onPick} />
        ))}
        {!shop && <GoShopCell width={cellWidth} label={GO_SHOP} onPress={goShop} />}
      </ScrollView>

      {buyable && (
        <View style={styles.buySlot} pointerEvents="box-none">
          <ChunkyButton
            label={buyButtonLabel(formatCount(tryPrice))}
            onPress={() => setSheetOpen(true)}
            bg={tryLack > 0 ? '#2B3370' : colors.pink}
            ink={tryLack > 0 ? colors.textSub : colors.line}
            drop={tryLack > 0 ? '#1A2050' : colors.pinkShadow}
          />
        </View>
      )}

      <BuySheet itemId={sheetOpen && buyable ? tryOn : null} coin={coin} preview={preview} onBuy={onBuy} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

function SegmentButton({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.segmentBtn, on && styles.segmentOn]}
    >
      <Text style={[styles.segmentText, { color: on ? colors.line : colors.textSub }]}>{label}</Text>
    </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontFamily: fonts.title, fontSize: 22, color: colors.yellow },
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
  segment: {
    flexShrink: 0,
    marginTop: L.segment.top,
    marginHorizontal: L.segment.side,
    height: L.segment.height,
    padding: 4,
    borderRadius: 22,
    backgroundColor: colors.cardSub,
    flexDirection: 'row',
    gap: 4,
  },
  segmentBtn: { flex: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  segmentOn: { backgroundColor: colors.yellow },
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
  buySlot: { position: 'absolute', left: L.buy.side, right: L.buy.side, bottom: L.buy.bottom - CHUNKY_DROP, height: CHUNKY_HEIGHT + CHUNKY_DROP },
});
