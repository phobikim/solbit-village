// 옷장 미리보기 무대 (디자인 TURN 28): 물 · 땅 · 풀 · 나무 · 꽃 장식 위에 솔이(옷 입은 모습)를 올린다.
// main = 옷장 탭의 미리보기 카드(높이 284, 솔이 180×216), sheet = 구매 확인 시트의 미리보기(높이 210, 솔이 140×168).
// 장식은 카드 가운데를 기준으로 그려서 카드 너비가 달라도 솔이가 가운데에 선다.

import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import type { Equipped } from '../../domain/outfit';
import { SoliOutfit } from '../characters/SoliOutfit';
import { colors } from '../theme';

type Variant = 'main' | 'sheet';

const SPEC = {
  main: {
    height: 284,
    radius: 28,
    water: 54,
    waves: true,
    dark: { w: 250, h: 58, bottom: 20 },
    green: { w: 250, h: 50, bottom: 40 },
    shadow: { w: 80, h: 12, bottom: 60 },
    soli: { w: 180, bottom: 52 },
  },
  sheet: {
    height: 210,
    radius: 24,
    water: 40,
    waves: false,
    dark: { w: 200, h: 46, bottom: 14 },
    green: { w: 200, h: 40, bottom: 30 },
    shadow: { w: 66, h: 10, bottom: 46 },
    soli: { w: 140, bottom: 39 },
  },
} as const;

const LINE = colors.line;

type Props = {
  variant: Variant;
  width: number;
  equipped: Equipped;
  /** 왼쪽 위에 얹는 것 (이장 말풍선) */
  children?: ReactNode;
};

/** 정지한 장식. 옷이 바뀌어도 다시 그리지 않는다 */
const Decor = memo(function Decor({ variant, width }: { variant: Variant; width: number }) {
  const S = SPEC[variant];
  const H = S.height;
  const cx = width / 2;
  const top = (bottom: number, h: number) => H - bottom - h;
  const oval = (o: { w: number; h: number; bottom: number }, fill: string) => (
    <Ellipse cx={cx} cy={top(o.bottom, o.h) + o.h / 2} rx={(o.w - 3) / 2} ry={(o.h - 3) / 2} fill={fill} stroke={LINE} strokeWidth={3} />
  );
  const waterTop = H - S.water;
  const main = variant === 'main';
  return (
    <Svg width={width} height={H} viewBox={`0 0 ${width} ${H}`}>
      {main && (
        <>
          <Circle cx={cx - 141} cy={72} r={2} fill={colors.yellow} opacity={0.7} />
          <Circle cx={cx + 119.5} cy={62.5} r={2.5} fill={colors.yellow} opacity={0.8} />
          <Circle cx={cx + 148.5} cy={121.5} r={1.5} fill={colors.yellow} opacity={0.6} />
          <Circle cx={cx - 157.5} cy={151.5} r={1.5} fill={colors.yellow} opacity={0.6} />
        </>
      )}
      <Rect x={0} y={waterTop} width={width} height={S.water} fill="#2D5AA6" />
      <Rect x={0} y={waterTop} width={width} height={3} fill={LINE} />
      {S.waves && (
        <Path
          d={`M${cx - 159} ${waterTop + 26}q8-4 16 0M${cx - 63} ${waterTop + 38}q8-4 16 0M${cx + 53} ${waterTop + 30}q8-4 16 0M${cx + 137} ${waterTop + 40}q8-4 16 0`}
          stroke={colors.health}
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {oval(S.dark, '#5A3E5E')}
      {oval(S.green, '#4FA83A')}
      {main && (
        <>
          {/* 나무 (40×56) */}
          <Path d={`M${cx - 93} ${H - 62 - 2}V${H - 62 - 22}`} stroke={LINE} strokeWidth={7} strokeLinecap="round" />
          <Path d={`M${cx - 93} ${H - 62 - 2}V${H - 62 - 22}`} stroke="#8E5A38" strokeWidth={3} strokeLinecap="round" />
          <Circle cx={cx - 93} cy={H - 62 - 36} r={15} fill="#3E8A3A" stroke={LINE} strokeWidth={3} />
          <Circle cx={cx - 103} cy={H - 62 - 26} r={9} fill="#3E8A3A" stroke={LINE} strokeWidth={3} />
          <Circle cx={cx - 83} cy={H - 62 - 26} r={9} fill="#3E8A3A" stroke={LINE} strokeWidth={3} />
          {/* 꽃 (16×22) */}
          <Path d={`M${cx + 95} ${H - 64}V${H - 64 - 12}`} stroke="#3E7A3A" strokeWidth={2.6} strokeLinecap="round" />
          <Circle cx={cx + 95} cy={H - 64 - 15} r={5.5} fill={colors.pink} stroke={LINE} strokeWidth={2} />
          <Circle cx={cx + 95} cy={H - 64 - 15} r={2.2} fill={colors.yellow} />
        </>
      )}
      <Ellipse cx={cx} cy={top(S.shadow.bottom, S.shadow.h) + S.shadow.h / 2} rx={S.shadow.w / 2} ry={S.shadow.h / 2} fill="#2E6A2E" />
    </Svg>
  );
});

export function ClosetStage({ variant, width, equipped, children }: Props) {
  const S = SPEC[variant];
  const soliH = (S.soli.w * 240) / 200;
  return (
    <View style={[styles.card, { width, height: S.height, borderRadius: S.radius }]}>
      <Decor variant={variant} width={width} />
      <View pointerEvents="none" style={{ position: 'absolute', left: (width - S.soli.w) / 2, top: S.height - S.soli.bottom - soliH }}>
        <SoliOutfit equipped={equipped} box={{ width: S.soli.w }} style={{ width: S.soli.w, height: soliH }} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', backgroundColor: colors.cardSub },
});
