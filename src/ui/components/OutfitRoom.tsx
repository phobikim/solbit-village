// 복장 고르기의 솔이 미리보기 카드 (디자인 26c~f): 방(액자 · 거울 · 러그) + 가운데에 기본 포즈 솔이 + 입은 옷.
// 방은 366×250 좌표계에 그려 카드 크기에 맞게 줄인다. 숨쉬기: 솔이만 위아래 1.5px, 약 3초 주기 (모션 줄이기 · 화면이 뒤에 있을 때는 정지).

import { memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Circle, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

import { OUTFIT_PREVIEW_LABEL } from '../../copy/outfits.ko';
import type { Equipped } from '../../domain/outfit';
import { SoliOutfit } from '../characters/SoliOutfit';
import { colors } from '../theme';

const STAGE = { width: 366, height: 250 } as const;
/** 솔이 캔버스 자리 (시안: left 98 · top 26 · 170×204) */
const SOLI = { left: 98, top: 26, width: 170, height: 204 } as const;

const WOOD = '#8A5A3C';

type Props = {
  width: number;
  height: number;
  equipped: Equipped;
  /** 화면이 앞에 있을 때만 숨 쉰다 */
  active: boolean;
  reduceMotion: boolean;
};

/** 정지한 방 그림 (옷이 바뀌어도 다시 그리지 않는다) */
const RoomArt = memo(function RoomArt({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} preserveAspectRatio="xMidYMax meet">
      {/* 바닥 */}
      <Rect x={-120} y={180} width={STAGE.width + 240} height={70} fill="#182050" />
      <Rect x={-120} y={177} width={STAGE.width + 240} height={3} fill="#2B3370" />
      {/* 액자 */}
      <Rect x={30} y={34} width={56} height={46} rx={6} fill={WOOD} />
      <Rect x={35} y={39} width={46} height={36} rx={2} fill="#3A4488" />
      <Defs>
        <ClipPath id="outfitRoomWin">
          <Rect x={35} y={39} width={46} height={36} rx={2} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#outfitRoomWin)">
        <Circle cx={67} cy={51} r={6} fill={colors.yellow} />
        <Path d="M33 75V65C43 57 53 57 61 63C67 59 75 59 83 65V75Z" fill="#2F6B4A" />
      </G>
      {/* 거울 */}
      <Path d="M290 61a25 25 0 0 1 50 0V188a8 8 0 0 1-8 8H298a8 8 0 0 1-8-8z" fill={WOOD} />
      <Path d="M295 61a20 20 0 0 1 40 0V188a3 3 0 0 1-3 3H298a3 3 0 0 1-3-3z" fill="#33407E" />
      <Rect x={296} y={194} width={6} height={18} rx={3} fill="#6B4430" />
      <Rect x={328} y={194} width={6} height={18} rx={3} fill="#6B4430" />
      {/* 러그 */}
      <Ellipse cx={183} cy={218} rx={135} ry={24} fill="#4B3D8F" />
      <Ellipse cx={183} cy={218} rx={120} ry={15} fill="none" stroke={colors.leisure} strokeWidth={2.5} strokeDasharray="5 4" />
      {/* 솔이 그림자 */}
      <Ellipse cx={183} cy={219} rx={50} ry={7} fill="#2E2463" />
    </Svg>
  );
});

export function OutfitRoom({ width, height, equipped, active, reduceMotion }: Props) {
  const scale = Math.min(width / STAGE.width, height / STAGE.height);
  // viewBox를 가운데 · 아래에 붙여 그린 것과 같은 자리에 솔이를 놓는다
  const offX = (width - STAGE.width * scale) / 2;
  const offY = height - STAGE.height * scale;
  const run = active && !reduceMotion;

  const y = useSharedValue(0);
  useEffect(() => {
    if (!run) {
      cancelAnimation(y);
      y.value = 0;
      return;
    }
    y.value = -1.5;
    y.value = withRepeat(withTiming(1.5, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(y);
  }, [run, y]);
  const breath = useAnimatedStyle(() => ({ transform: [{ translateY: y.value * scale }] }));

  const soliW = SOLI.width * scale;
  const soliH = SOLI.height * scale;
  return (
    <View style={[styles.card, { width, height }]} accessible accessibilityLabel={OUTFIT_PREVIEW_LABEL}>
      <RoomArt width={width} height={height} />
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: offX + SOLI.left * scale, top: offY + SOLI.top * scale, width: soliW, height: soliH }, breath]}
      >
        <SoliOutfit equipped={equipped} box={{ width: soliW }} style={{ width: soliW, height: soliH }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden', backgroundColor: colors.cardSub },
});
