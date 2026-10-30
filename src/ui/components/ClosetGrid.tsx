// 옷장 탭의 3열 격자 칸 (디자인 TURN 28). 내 옷장 · 옷 가게가 같은 칸을 쓴다.
// 썸네일: 몸 · 등은 솔이에게 입힌 모습, 머리 · 얼굴 · 손 · 발은 옷만 크롭한다 (시안 thumb() / dressed()).

import { memo, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path, SvgXml } from 'react-native-svg';

import { cellA11y, OUTFIT_NAME, OWNED_TAG, shortLabel } from '../../copy/outfits.ko';
import { itemMeta } from '../../domain/outfit';
import { formatCount } from '../../domain/wallet';
import { dressedThumbBox, itemThumbBox } from '../characters/outfits';
import { ICON_COIN, ICON_STAR } from '../characters/rewardIcons';
import { SoliOutfit } from '../characters/SoliOutfit';
import { CLOSET_LAYOUT } from '../layout';
import { colors, fonts, SHORT_INK } from '../theme';

const THUMB = CLOSET_LAYOUT.thumb;

export type CellView = {
  id: string;
  /** 내 옷장에서 지금 입고 있다 (노랑 링 + 체크) */
  wearing: boolean;
  /** 옷 가게에서 입어 보는 중 (분홍 링) */
  tryOn: boolean;
  /** 옷 가게: 이미 가진 옷 (흐리게 + 보유 태그, 가격 없음). 방금 산 옷은 흐리게 하지 않는다 */
  owned: boolean;
  /** 옷 가게: 안 가진 옷의 가격 (가진 옷과 내 옷장 칸은 null) */
  price: number | null;
  /** 코인이 모자란 만큼 (0이면 충분) */
  lack: number;
  /** 방금 산 옷: 별이 반짝인다 */
  just: boolean;
};

type Props = CellView & { width: number; reduceMotion: boolean; onPress: (id: string) => void };

export const ClosetCell = memo(function ClosetCell({ id, wearing, tryOn, owned, price, lack, just, width, reduceMotion, onPress }: Props) {
  const meta = itemMeta(id);
  const name = OUTFIT_NAME[id] ?? id;
  const dressed = meta?.slot === 'body' || meta?.slot === 'back';
  // 가게에서 이미 가진 옷: 흐리게 + "보유" 태그 + 이름 #8F96CC. 방금 산 옷은 그대로 밝게 둔다
  const ownedDim = owned && price === null && !wearing && !just;
  const short = price !== null && lack > 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cellA11y(name, {
        wearing,
        tryOn,
        owned: ownedDim,
        price: price !== null ? formatCount(price) : undefined,
        lack: short ? formatCount(lack) : undefined,
      })}
      accessibilityState={{ selected: wearing || tryOn }}
      onPress={() => onPress(id)}
      style={[styles.cell, { width }]}
    >
      <View style={[styles.tile, { width, height: width }]}>
        <View style={{ width: THUMB, height: THUMB, opacity: ownedDim ? 0.4 : 1 }}>
          {meta && (
            <SoliOutfit
              equipped={{ [meta.slot]: id }}
              box={dressed ? dressedThumbBox(id, THUMB) : itemThumbBox(id, THUMB)}
              itemsOnly={!dressed}
              style={{ width: THUMB, height: THUMB }}
            />
          )}
        </View>
        {wearing && <View pointerEvents="none" style={[styles.ring, { borderColor: colors.yellow }]} />}
        {tryOn && !wearing && <View pointerEvents="none" style={[styles.ring, { borderColor: colors.pink }]} />}
        {wearing && (
          <View pointerEvents="none" style={styles.check}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7.5" />
            </Svg>
          </View>
        )}
        {(ownedDim || (owned && just)) && (
          <View pointerEvents="none" style={styles.ownTag}>
            <Text style={styles.ownTagText}>{OWNED_TAG}</Text>
          </View>
        )}
        {just && <Sparkles reduceMotion={reduceMotion} />}
      </View>
      <Text style={[styles.name, { color: owned && price === null ? colors.textMuted : colors.text }]}>{name}</Text>
      {price !== null && (
        <View style={[styles.price, short && styles.priceShort]}>
          <View style={{ opacity: short ? 0.45 : 1 }}>
            <SvgXml xml={ICON_COIN} width={18} height={18} />
          </View>
          <Text style={[styles.priceText, short && styles.priceTextShort]}>{formatCount(price)}</Text>
        </View>
      )}
      {short && <Text style={styles.lack}>{shortLabel(formatCount(lack))}</Text>}
    </Pressable>
  );
});

/** 옷 가게 가기 칸 (내 옷장의 마지막 칸, 점선) */
export function GoShopCell({ width, label, onPress }: { width: number; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.cell, { width }]}>
      <View style={[styles.goShop, { width, height: width }]}>
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={2.6} strokeLinecap="round">
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      </View>
      <Text style={[styles.name, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

/** 방금 산 옷 칸 위에서 반짝이는 별 3개 (시안 28f). 모션 줄이기면 멈춘 채 보인다 */
function Sparkles({ reduceMotion }: { reduceMotion: boolean }) {
  const t = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) {
      t.value = 1;
      return;
    }
    const ease = Easing.inOut(Easing.sin);
    t.value = withRepeat(withSequence(withTiming(0.45, { duration: 520, easing: ease }), withTiming(1, { duration: 520, easing: ease })), -1);
    return () => cancelAnimation(t);
  }, [reduceMotion, t]);
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.85 + 0.15 * t.value }] }));
  return (
    <>
      <Animated.View pointerEvents="none" style={[styles.starA, style]}>
        <SvgXml xml={ICON_STAR} width={26} height={26} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.starB, style]}>
        <SvgXml xml={ICON_STAR} width={16} height={16} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.starC, style]}>
        <SvgXml xml={ICON_STAR} width={12} height={12} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  cell: { alignItems: 'center', gap: 6 },
  tile: { borderRadius: 20, backgroundColor: colors.cardSub, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 20, borderWidth: 3 },
  check: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.night,
  },
  ownTag: { position: 'absolute', left: 8, top: 8, height: 20, paddingHorizontal: 8, borderRadius: 10, backgroundColor: colors.night, justifyContent: 'center' },
  ownTagText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textSub },
  name: { fontFamily: fonts.bodyHeavy, fontSize: 13 },
  price: { height: 24, flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 3, paddingRight: 9, borderRadius: 12, backgroundColor: '#2B3370' },
  priceShort: { backgroundColor: colors.cardSub },
  priceText: { fontFamily: fonts.numberBold, fontSize: 13, color: colors.yellow },
  priceTextShort: { color: '#6E76B0' },
  lack: { marginTop: -3, fontFamily: fonts.bodyHeavy, fontSize: 11, color: SHORT_INK },
  goShop: { borderRadius: 20, borderWidth: 2.5, borderStyle: 'dashed', borderColor: '#3A4386', alignItems: 'center', justifyContent: 'center' },
  starA: { position: 'absolute', right: -8, top: -10 },
  starB: { position: 'absolute', left: -6, bottom: 14 },
  starC: { position: 'absolute', right: 14, bottom: -6 },
});
