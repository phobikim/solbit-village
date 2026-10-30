// 구매 확인 시트 (디자인 TURN 28d·e). 아래에서 올라오고, 뒤는 어둡게 하고, 바깥을 누르면 닫힌다.
// 위에서 아래로: 손잡이 · 미리보기(210) · 옷 이름 + 가격 칩 · "지금 코인 / 산 뒤" 박스 · 버튼.
// 코인이 충분하면 [사기] + [다음에], 모자라면 "모자라요 -N"만 보이고 [다음에]만 둔다.

import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';

import { OUTFIT_NAME, SHEET_AFTER, SHEET_BUY, SHEET_LATER, SHEET_NOW_COIN, SHORT_WORD } from '../../copy/outfits.ko';
import type { Equipped } from '../../domain/outfit';
import { priceOf } from '../../domain/shop';
import { formatCount, shortBy } from '../../domain/wallet';
import { ICON_COIN } from '../characters/rewardIcons';
import { APP_MAX_WIDTH } from '../layout';
import { colors, fonts, SHORT_INK } from '../theme';
import { ChunkyButton } from './ChunkyButton';
import { ClosetStage } from './ClosetStage';

const OPEN_MS = 320;
const CLOSE_MS = 220;
const SHEET_PAD_X = 20;

type Props = {
  /** 살지 말지 묻는 옷. null이면 닫혀 있다 */
  itemId: string | null;
  coin: number;
  /** 미리보기에 입힐 모습 (입은 옷 + 입어 보는 옷) */
  preview: Equipped;
  onBuy: (itemId: string) => void;
  onClose: () => void;
};

export function BuySheet({ itemId, coin, preview, onBuy, onClose }: Props) {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sheetW = Math.min(winW, APP_MAX_WIDTH);

  // 닫는 애니메이션이 끝날 때까지 Modal과 마지막 옷을 남겨 둔다
  const [shown, setShown] = useState<string | null>(itemId);
  const [mounted, setMounted] = useState(itemId !== null);
  const ty = useSharedValue(winH);
  const scrim = useSharedValue(0);

  useEffect(() => {
    if (itemId !== null) {
      setShown(itemId);
      setMounted(true);
      ty.value = winH;
      ty.value = withTiming(0, { duration: OPEN_MS, easing: Easing.bezier(0.2, 0.9, 0.3, 1) });
      scrim.value = withTiming(1, { duration: 240 });
      return;
    }
    ty.value = withTiming(winH, { duration: CLOSE_MS, easing: Easing.in(Easing.quad) });
    scrim.value = withTiming(0, { duration: CLOSE_MS });
    const id = setTimeout(() => setMounted(false), CLOSE_MS + 40);
    return () => clearTimeout(id);
  }, [itemId, winH, ty, scrim]);
  useEffect(
    () => () => {
      cancelAnimation(ty);
      cancelAnimation(scrim);
    },
    [ty, scrim],
  );

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  const price = shown !== null ? priceOf(shown) : undefined;
  if (!mounted || shown === null || price === undefined) return null;
  const lack = shortBy(coin, price);
  const can = lack === 0;
  const name = OUTFIT_NAME[shown] ?? shown;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]}>
          <Pressable accessibilityRole="button" accessibilityLabel={SHEET_LATER} style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { width: sheetW, paddingBottom: 34 + insets.bottom * 0.5 }, sheetStyle]}>
          <View style={styles.handle} />
          <ClosetStage variant="sheet" width={sheetW - SHEET_PAD_X * 2} equipped={preview} />
          <View style={styles.titleRow}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.priceChip}>
              <SvgXml xml={ICON_COIN} width={26} height={26} />
              <Text style={styles.priceText}>{formatCount(price)}</Text>
            </View>
          </View>
          <View style={styles.box}>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>{SHEET_NOW_COIN}</Text>
              <Text style={styles.lineNum}>{formatCount(coin)}</Text>
            </View>
            <View style={styles.rule} />
            {can ? (
              <View style={styles.line}>
                <Text style={styles.lineLabel}>{SHEET_AFTER}</Text>
                <Text style={[styles.lineNum, { color: colors.relation }]}>{formatCount(coin - price)}</Text>
              </View>
            ) : (
              <View style={styles.line}>
                <Text style={[styles.lineLabel, styles.shortLabel]}>{SHORT_WORD}</Text>
                <Text style={[styles.lineNum, { color: SHORT_INK }]}>-{formatCount(lack)}</Text>
              </View>
            )}
          </View>
          <View style={styles.buttons}>
            {can && <ChunkyButton label={SHEET_BUY} onPress={() => onBuy(shown)} />}
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.later}>
              <Text style={styles.laterText}>{SHEET_LATER}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { backgroundColor: 'rgba(13,17,48,0.7)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    paddingHorizontal: SHEET_PAD_X,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -10 },
    elevation: 20,
  },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.disabled, alignSelf: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  name: { flexShrink: 1, fontFamily: fonts.title, fontSize: 26, color: colors.yellow },
  priceChip: { height: 34, flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 4, paddingRight: 12, borderRadius: 17, backgroundColor: '#2B3370' },
  priceText: { fontFamily: fonts.numberBold, fontSize: 17, color: colors.yellow },
  box: { backgroundColor: colors.cardSub, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, gap: 10 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textSub },
  shortLabel: { fontFamily: fonts.bodyHeavy, color: SHORT_INK },
  lineNum: { fontFamily: fonts.numberBold, fontSize: 17, color: colors.text },
  rule: { height: 2, borderRadius: 1, backgroundColor: '#2B3370' },
  buttons: { gap: 4 },
  later: { height: 48, alignItems: 'center', justifyContent: 'center' },
  laterText: { fontFamily: fonts.bodyHeavy, fontSize: 15, color: colors.textSub },
});
