// 꾸미기 · 마을 모드의 2열 격자 칸 (디자인 #31b): 4:3 칸에 배경 썸네일 + 이름 + (안 가졌으면) 가격 칩.
// 칸 규칙은 솔이 옷 칸과 같다 — 안 가진 배경은 불투명도 60% + 어두운 오버레이로 흑백 느낌 (SVG 필터 없이, 형태는 보인다), 이름 #8F96CC,
// 적용 중은 노랑 링 + 체크, 선택은 분홍 링. 썸네일은 메인 장면과 같은 테마 색에서 만든다 (art.ts thumbSvg).

import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';

import { bgCellA11y } from '../../copy/closet.ko';
import type { TimeOfDay } from '../../domain/types';
import { bgName } from '../../domain/villageBg';
import { formatCount } from '../../domain/wallet';
import { CachedSvg } from '../characters/CachedSvg';
import { ICON_COIN } from '../characters/rewardIcons';
import { THUMB, thumbSvg } from '../scene/art';
import { resolveTheme } from '../scene/theme';
import { colors, fonts } from '../theme';
import { Sparkles } from './ClosetGrid';

export type BgCellView = {
  id: string;
  /** 지금 적용 중 (노랑 링 + 체크) */
  wearing: boolean;
  /** 눌러서 고른 칸 (분홍 링) — 미리보기에 반영돼 있다 */
  selected: boolean;
  owned: boolean;
  price: number;
  /** 안 가진 배경인데 코인이 모자라다 (가격 칩 글자 #8F96CC + 코인 불투명도 .5, 경고색 없음) */
  short: boolean;
  /** 방금 산 배경: 별이 반짝인다 */
  just: boolean;
};

type Props = BgCellView & { width: number; timeOfDay: TimeOfDay; reduceMotion: boolean; onPress: (id: string) => void };

/** 칸 안 여백 5, 썸네일 비율은 칸 4:3 */
const PAD = 5;

export const VillageCell = memo(function VillageCell({ id, wearing, selected, owned, price, short, just, width, timeOfDay, reduceMotion, onPress }: Props) {
  const name = bgName(id);
  const tileH = Math.round((width * 3) / 4);
  const innerW = width - PAD * 2;
  const innerH = tileH - PAD * 2;
  const xml = useMemo(() => thumbSvg(resolveTheme(id, timeOfDay)), [id, timeOfDay]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={bgCellA11y(name, { wearing, selected, owned, price: formatCount(price) })}
      accessibilityState={{ selected: wearing || selected }}
      onPress={() => onPress(id)}
      style={[styles.cell, { width }]}
    >
      <View style={[styles.tile, { width, height: tileH, padding: PAD }]}>
        <View style={[styles.thumb, { width: innerW, height: innerH, opacity: owned ? 1 : 0.6 }]}>
          <CachedSvg xml={xml} width={innerW} height={innerH} />
        </View>
        {!owned && <View pointerEvents="none" style={[styles.dim, { left: PAD, top: PAD, right: PAD, bottom: PAD }]} />}
        {wearing && <View pointerEvents="none" style={[styles.ring, { borderColor: colors.yellow }]} />}
        {selected && !wearing && <View pointerEvents="none" style={[styles.ring, { borderColor: colors.pink }]} />}
        {wearing && (
          <View pointerEvents="none" style={styles.check}>
            <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={colors.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M5 12.5l4.5 4.5L19 7.5" />
            </Svg>
          </View>
        )}
        {just && <Sparkles reduceMotion={reduceMotion} />}
      </View>
      <Text style={[styles.name, { color: owned ? colors.text : colors.textMuted }]}>{name}</Text>
      {!owned && (
        <View style={styles.price}>
          <View style={{ opacity: short ? 0.5 : 1 }}>
            <SvgXml xml={ICON_COIN} width={18} height={18} />
          </View>
          <Text style={[styles.priceText, short && { color: colors.textMuted }]}>{formatCount(price)}</Text>
        </View>
      )}
    </Pressable>
  );
});

/** 썸네일 그림 비율 (참고용: 366 : 270) */
export const THUMB_RATIO = (THUMB.height - THUMB.cropTop) / THUMB.width;

const styles = StyleSheet.create({
  cell: { alignItems: 'center', gap: 6 },
  tile: { borderRadius: 20, backgroundColor: colors.cardSub },
  thumb: { borderRadius: 15, overflow: 'hidden' },
  dim: { position: 'absolute', borderRadius: 15, backgroundColor: 'rgba(30,37,88,0.25)' },
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
  name: { fontFamily: fonts.bodyHeavy, fontSize: 13 },
  price: { height: 24, flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 3, paddingRight: 9, borderRadius: 12, backgroundColor: '#2B3370' },
  priceText: { fontFamily: fonts.numberBold, fontSize: 13, color: colors.yellow },
});
