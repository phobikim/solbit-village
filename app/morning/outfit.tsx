// 아침 흐름 3번째 화면 "복장 고르기(솔이네 옷장)" (디자인 26c~f). 옷은 장식일 뿐이다 — 지수 · 레벨 · 작물 · 월급과 이어지지 않고, 하루 종류나 컨디션과도 상관없이 고른다.
// "이대로 가기"를 눌러야 저장된다. 옷 가게 · 코인 · 가격은 이 화면에 두지 않는다.

import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OUTFIT_BROADCAST, OUTFIT_GO, OUTFIT_STRIP } from '../../src/copy/outfits.ko';
import type { Slot } from '../../src/domain/outfit';
import { useOutfit } from '../../src/state/outfit';
import { BroadcastLine } from '../../src/ui/components/BroadcastLine';
import { MorningHeader } from '../../src/ui/components/MorningHeader';
import { OutfitRoom } from '../../src/ui/components/OutfitRoom';
import { OutfitWardrobe } from '../../src/ui/components/OutfitWardrobe';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { APP_MAX_WIDTH, OUTFIT_LAYOUT, outfitLayout } from '../../src/ui/layout';
import { AFTER_OUTFIT_HREF } from '../../src/ui/navigation';
import { colors, fonts } from '../../src/ui/theme';
import { useScreenActive } from '../../src/ui/useScreenActive';
import { useVisibleHeight } from '../../src/ui/useVisibleHeight';

const M = OUTFIT_LAYOUT;
const pad = (n: number) => String(n).padStart(2, '0');

export default function MorningOutfitScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const visibleHeight = useVisibleHeight();
  const reduceMotion = useReducedMotion();
  const active = useScreenActive();

  const draft = useOutfit((s) => s.draft);
  const owned = useOutfit((s) => s.owned);
  const load = useOutfit((s) => s.load);
  const wear = useOutfit((s) => s.wear);
  const takeOff = useOutfit((s) => s.takeOff);
  const stripAll = useOutfit((s) => s.stripAll);
  const commit = useOutfit((s) => s.commit);

  const [slot, setSlot] = useState<Slot>('head');
  const leaving = useRef(false);

  // 들어올 때 마지막으로 저장한 착용 상태를 불러와 미리 입혀 둔다
  useEffect(() => {
    load().catch((e) => console.warn('[outfit] load failed', e));
  }, [load]);

  const L = outfitLayout(visibleHeight, insets.top, insets.bottom);
  const frameWidth = Math.min(windowWidth, APP_MAX_WIDTH);
  const now = new Date();

  const go = useCallback(async () => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      await commit();
    } catch (e) {
      // 저장이 안 돼도 하루를 막지 않는다 (옷은 장식일 뿐)
      console.warn('[outfit] save failed', e);
    }
    router.replace(AFTER_OUTFIT_HREF);
  }, [commit]);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScrollView
        scrollEnabled={L.scroll}
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { minHeight: visibleHeight - insets.top }]}
      >
        <MorningHeader step={2} />
        <BroadcastLine message={OUTFIT_BROADCAST} time={`${pad(now.getHours())}:${pad(now.getMinutes())}`} />

        <View style={styles.preview}>
          <OutfitRoom width={frameWidth - 24} height={L.preview} equipped={draft} active={active} reduceMotion={reduceMotion} />
        </View>

        <View style={[styles.panel, { paddingBottom: insets.bottom + M.bottomPad }]}>
          <OutfitWardrobe
            slot={slot}
            onSlot={setSlot}
            equipped={draft}
            owned={owned}
            onPick={wear}
            onNone={takeOff}
            pageWidth={frameWidth - 28}
            tabHeight={L.tab}
            cellHeight={L.cell}
          />
          <View style={styles.spacer} />
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={stripAll} style={styles.strip}>
              <Text style={styles.stripLabel}>{OUTFIT_STRIP}</Text>
            </Pressable>
            <PrimaryButton label={OUTFIT_GO} onPress={go} style={styles.go} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { flexGrow: 1 },
  preview: { marginTop: M.gapPreview, marginHorizontal: 12 },
  panel: {
    flexGrow: 1,
    marginTop: M.gapPanel,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: M.panelTop,
    paddingHorizontal: 14,
  },
  spacer: { flexGrow: 1, minHeight: M.gapAction },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  strip: { width: 72, height: 44, alignItems: 'center', justifyContent: 'center' },
  stripLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textMuted },
  go: { flex: 1 },
});
