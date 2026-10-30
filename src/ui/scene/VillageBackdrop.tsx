// 새 메인의 전체 화면 마을 장면 (디자인 TURN 30, 시안 live18). 390×844 좌표계를 xMidYMax slice로 깔아 화면을 꽉 채운다.
// 층 순서(아래→위): 하늘 → 별 · 해 → 구름 → 땅(원경 · 중경 · 냇가 · 마당 · 울타리) → 나무 → 풀 · 꽃 → 솔이 → 반딧불이/나비 → 밭 5칸.
// 움직임은 reanimated: 시계 하나(초)를 두고 조각마다 그 시계로 위치 · 투명도 · 기울기를 계산한다.
//   - 화면이 안 보이면(다른 탭 · 앱이 뒤로 감 · active=false) 시계를 멈추고, 시스템 "동작 줄이기"가 켜져 있으면 처음부터 멈춘 채 둔다.
//   - 움직이는 조각은 밤 약 30개 / 낮 약 26개로 줄여 두었다 (별은 주기별 3묶음).
// 밭은 누를 수 없다 (규칙 5). 이 층은 터치를 받지 않는다 — 솔이를 누르는 영역은 화면(index.tsx)이 따로 얹는다.

import { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import type { PlotSlot } from '../../domain/types';
import { CachedSvg } from '../characters/CachedSvg';
import { soliWithSkinSvg, type SoliMood } from '../characters/soli';
import { wrap } from '../characters/svg';
import { sceneFit, SCENE_DESIGN } from '../mainScene';
import {
  butterflySpecs,
  cloudSpecs,
  connectedVariant,
  fireflySpecs,
  flowerPieces,
  landSvg,
  PLOT,
  plotCellSvg,
  plotLeft,
  SCENE_H,
  SCENE_W,
  shadowSvg,
  skySvg,
  SOLI_BOB,
  SOLI_BOX,
  starPiece,
  STAR_GROUPS,
  STAR_PERIODS,
  sunPiece,
  tuftPieces,
  treePieces,
  type BugSpec,
  type Piece,
  type SceneVariant,
  type SwayPiece,
} from './art';

const TAU = Math.PI * 2;

export type VillageBackdropProps = {
  variant: SceneVariant;
  width: number;
  height: number;
  plots: readonly PlotSlot[];
  soliMood: SoliMood;
  soliSkin: string | null;
  /** 화면이 앞에 있다 (포커스 + 앱이 앞). false면 움직임을 멈춘다 */
  active: boolean;
};

/** 시계(초). running이 아니면 멈춘다 */
function useSceneClock(running: boolean): SharedValue<number> {
  const t = useSharedValue(0);
  useEffect(() => {
    if (!running) return;
    // 1시간마다 한 번 처음으로 돌아간다 (눈에 띄지 않는 주기)
    t.value = withRepeat(withTiming(t.value + 3600, { duration: 3600 * 1000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [running, t]);
  return t;
}

const box = (p: Piece) => ({ position: 'absolute' as const, left: p.left, top: p.top, width: p.width, height: p.height });

const Art = ({ p }: { p: Piece }) => <CachedSvg xml={p.xml} width={p.width} height={p.height} />;

const Twinkle = memo(function Twinkle({ p, period, t }: { p: Piece; period: number; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: 0.6 + 0.4 * Math.cos((TAU * t.value) / period) }));
  return (
    <Animated.View style={[box(p), style]}>
      <Art p={p} />
    </Animated.View>
  );
});

const Drift = memo(function Drift({ p, dx, period, t }: { p: Piece; dx: number; period: number; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: (dx * (1 - Math.cos((TAU * t.value) / period))) / 2 }] }));
  return (
    <Animated.View style={[box(p), style]}>
      <Art p={p} />
    </Animated.View>
  );
});

const Spin = memo(function Spin({ p, period, t }: { p: Piece; period: number; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${(360 * (t.value % period)) / period}deg` }] }));
  return (
    <Animated.View style={[box(p), style]}>
      <Art p={p} />
    </Animated.View>
  );
});

/** 중심(px, py) 둘레로 ±angle도 흔들린다 */
const Sway = memo(function Sway({ s, t, phase }: { s: SwayPiece; t: SharedValue<number>; phase: number }) {
  const { piece: p, angle, period } = s;
  const cx = p.px - p.width / 2;
  const cy = p.py - p.height / 2;
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: cx },
      { translateY: cy },
      { rotate: `${-angle * Math.cos((TAU * (t.value + phase)) / period)}deg` },
      { translateY: -cy },
      { translateX: -cx },
    ],
  }));
  return (
    <Animated.View style={[box(p), style]}>
      <Art p={p} />
    </Animated.View>
  );
});

const Firefly = memo(function Firefly({ b, t }: { b: BugSpec; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const u = TAU * (t.value / b.loop) + b.phase;
    return {
      opacity: 0.6 + 0.4 * Math.cos((TAU * t.value) / b.blink),
      transform: [{ translateX: 11 * Math.sin(u) }, { translateY: 9 * Math.sin(2 * u + 0.8) }],
    };
  });
  return (
    <Animated.View style={[box(b.piece), style]}>
      <Art p={b.piece} />
    </Animated.View>
  );
});

const Butterfly = memo(function Butterfly({ b, t }: { b: BugSpec; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const u = TAU * (t.value / b.loop) + b.phase;
    return {
      transform: [
        { translateX: 34 * Math.sin(u) },
        { translateY: 20 * Math.sin(2 * u + 1) },
        { scaleX: 0.625 + 0.375 * Math.cos((TAU * t.value) / (b.blink * 2)) },
      ],
    };
  });
  return (
    <Animated.View style={[box(b.piece), style]}>
      <Art p={b.piece} />
    </Animated.View>
  );
});

/** 솔이 폴짝: 3초 주기, 0;-4;0;-16;0;0 (시안 keyTimes) */
const SoliJump = memo(function SoliJump({ xml, t }: { xml: string; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const u = (t.value % SOLI_BOB.period) / SOLI_BOB.period;
    return { transform: [{ translateY: interpolate(u, SOLI_BOB.keyTimes as unknown as number[], SOLI_BOB.values as unknown as number[]) * SOLI_BOB.unit }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: SOLI_BOX.left, top: SOLI_BOX.top, width: SOLI_BOX.width, height: SOLI_BOX.height }, style]}>
      <CachedSvg xml={xml} width={SOLI_BOX.width} height={SOLI_BOX.height} />
    </Animated.View>
  );
});

const Full = ({ xml }: { xml: string }) => (
  <View style={styles.full}>
    <CachedSvg xml={xml} width={SCENE_W} height={SCENE_H} />
  </View>
);

export const VillageBackdrop = memo(function VillageBackdrop({ variant, width, height, plots, soliMood, soliSkin, active }: VillageBackdropProps) {
  const reduceMotion = useReducedMotion();
  const t = useSceneClock(active && !reduceMotion);
  const v = connectedVariant(variant);
  const day = v === 'day';

  const art = useMemo(
    () => ({
      sky: skySvg(v),
      land: landSvg(v),
      shadow: shadowSvg(),
      stars: Array.from({ length: STAR_GROUPS }, (_, g) => starPiece(g)),
      sun: sunPiece(),
      clouds: cloudSpecs(v),
      trees: treePieces(),
      tufts: tuftPieces(),
      flowers: flowerPieces(),
      fireflies: fireflySpecs(),
      butterflies: butterflySpecs(),
    }),
    [v],
  );
  const soli = useMemo(() => wrap(soliWithSkinSvg(soliMood, soliSkin)), [soliMood, soliSkin]);
  const cells = useMemo(() => Array.from({ length: 5 }, (_, i) => plotCellSvg(plots[i] ?? null, v)), [plots, v]);

  const fit = sceneFit(width, height);
  // 원래 크기(390×844) 상자를 가운데 기준으로 배율만 줄이고 늘린다
  const frame = {
    position: 'absolute' as const,
    width: SCENE_DESIGN.width,
    height: SCENE_DESIGN.height,
    left: fit.left + (SCENE_DESIGN.width * fit.scale) / 2 - SCENE_DESIGN.width / 2,
    top: fit.top + (SCENE_DESIGN.height * fit.scale) / 2 - SCENE_DESIGN.height / 2,
    transform: [{ scale: fit.scale }],
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={frame}>
        <Full xml={art.sky} />
        {!day && art.stars.map((p, g) => <Twinkle key={`s${g}`} p={p} period={STAR_PERIODS[g]} t={t} />)}
        {day && <Spin p={art.sun} period={40} t={t} />}
        {art.clouds.map((c, i) => (
          <Drift key={`c${i}`} p={c.piece} dx={c.dx} period={c.period} t={t} />
        ))}
        <Full xml={art.land} />
        {art.trees.map((s, i) => (
          <Sway key={`t${i}`} s={s} t={t} phase={i * 0.7} />
        ))}
        {art.tufts.map((s, i) => (
          <Sway key={`u${i}`} s={s} t={t} phase={i * 0.5} />
        ))}
        {art.flowers.map((s, i) => (
          <Sway key={`f${i}`} s={s} t={t} phase={i * 0.9} />
        ))}
        <Full xml={art.shadow} />
        <SoliJump xml={soli} t={t} />
        {!day && art.fireflies.map((b, i) => <Firefly key={`ff${i}`} b={b} t={t} />)}
        {day && art.butterflies.map((b, i) => <Butterfly key={`bf${i}`} b={b} t={t} />)}
        {cells.map((xml, i) => (
          <View key={`p${i}`} style={{ position: 'absolute', left: plotLeft(i), top: PLOT.y, width: PLOT.width, height: PLOT.height }}>
            <CachedSvg xml={xml} width={PLOT.width} height={PLOT.height} />
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  full: { position: 'absolute', left: 0, top: 0, width: SCENE_W, height: SCENE_H },
});
