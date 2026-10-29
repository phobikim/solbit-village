// 오늘 하루 고르기의 장면 카드 (디자인 v4 25b~25e): 밤바다 위 작은 섬 + 솔이.
// 그림은 366×300 좌표계(stage)에 그려 카드 크기에 맞게 줄인다. 움직이는 객체: 별 6 + 솔이 1 + 바닥 그림자 1 (transform / opacity만).

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect, SvgXml } from 'react-native-svg';

import { soliPoseDelay, soliPoseFor, type DayType, type MorningCondition, type SoliPoseName } from '../../domain/morning';
import { SOLI_POSES, SOLI_POSE_VIEWBOX } from '../characters/soliPoses';
import { colors } from '../theme';

const STAGE = { width: 366, height: 300 } as const;
/** 솔이 그림 크기 (200×240을 0.885배) */
const SOLI = { left: 94, top: 24, width: 177, height: (177 * SOLI_POSE_VIEWBOX.height) / SOLI_POSE_VIEWBOX.width } as const;
const SHADOW_MAX = 104;

// [x, y, 크기, 색, 지연(초)] — 시안 8개 중 6개 (움직이는 별은 최대 6개)
const STARS: readonly (readonly [number, number, number, string, number])[] = [
  [28, 26, 10, colors.yellow, 0],
  [72, 70, 6, '#FFFFFF', 1.2],
  [40, 132, 7, '#FFFFFF', 0.5],
  [196, 22, 8, colors.yellow, 1.8],
  [330, 104, 6, '#FFFFFF', 0.9],
  [280, 150, 5, '#FFFFFF', 2.4],
];

/** 포즈별 바닥 그림자 너비 (시안) */
const SHADOW_W: Record<SoliPoseName, number> = { base: 92, walkA: 92, walkB: 92, rest: 92, jump: 58, land: 104 };
/** 점프 때 옅게, 착지 때 짙게 */
const SHADOW_OPACITY: Record<SoliPoseName, number> = { base: 0.85, walkA: 0.85, walkB: 0.85, rest: 0.85, jump: 0.45, land: 1 };

type Props = {
  width: number;
  height: number;
  dayType: DayType | null;
  condition: MorningCondition | null;
  /** 화면이 앞에 있을 때만 움직인다 */
  active: boolean;
  /** 모션 줄이기 */
  reduceMotion: boolean;
};

export function MorningScene({ width, height, dayType, condition, active, reduceMotion }: Props) {
  const scale = Math.min(width / STAGE.width, height / STAGE.height);
  const storm = condition === 'storm';
  const run = active && !reduceMotion;
  return (
    <View style={[styles.card, { width, height }]}>
      <View
        style={{
          position: 'absolute',
          width: STAGE.width,
          height: STAGE.height,
          left: (width - STAGE.width) / 2,
          // 줄인 그림의 바닥이 카드 바닥에 닿게
          top: height - STAGE.height / 2 - (STAGE.height / 2) * scale,
          transform: [{ scale }],
        }}
      >
        {/* 새벽빛 띠 (카드 좌우로 넘치게) */}
        <View style={[styles.band, { bottom: 20, height: 12, backgroundColor: '#3A3466' }]} />
        <View style={[styles.band, { bottom: 9, height: 11, backgroundColor: '#7A5470' }]} />
        <View style={[styles.band, { bottom: 0, height: 9, backgroundColor: '#FFB86B' }]} />
        {/* 폭풍인 날은 별을 끈다 (시안 24c) */}
        {!storm &&
          STARS.map(([x, y, s, c, d], i) => <Star key={i} x={x} y={y} size={s} color={c} delay={d} period={2.6 + (i % 3) * 0.7} run={run} />)}
        <Cloud storm={storm} />
        <Svg width={366} height={40} viewBox="0 0 366 40" style={{ position: 'absolute', left: 0, top: 226 }} fill="none" stroke="#4A5290" strokeWidth={2.4} strokeLinecap="round">
          <Path d="M34 14c6-5 12-5 18 0s12 5 18 0" />
          <Path d="M296 12c6-5 12-5 18 0s12 5 18 0" />
          <Path d="M150 32c6-5 12-5 18 0s12 5 18 0s12 5 18 0" />
        </Svg>
        <View style={{ position: 'absolute', left: 73, top: 226, width: 220, height: 24, borderRadius: 12, backgroundColor: '#24543A' }} />
        <View style={{ position: 'absolute', left: 73, top: 210, width: 220, height: 32, borderRadius: 16, backgroundColor: '#2F6B4A' }} />
        <Svg width={40} height={58} viewBox="0 0 40 58" style={{ position: 'absolute', left: 86, top: 166 }}>
          <Rect x={17.5} y={30} width={5} height={26} rx={2.5} fill="#7A5A3A" />
          <Circle cx={20} cy={20} r={15} fill="#3F8A5C" />
          <Circle cx={14} cy={28} r={9} fill="#3F8A5C" />
          <Circle cx={27} cy={28} r={9} fill="#3F8A5C" />
        </Svg>
        <Svg width={22} height={30} viewBox="0 0 26 32" style={{ position: 'absolute', left: 256, top: 196 }}>
          <Rect x={3} y={2} width={2.6} height={29} rx={1.3} fill="#FFFFFF" />
          <Path d="M5.6 3h17l-4 5 4 5h-17z" fill={colors.pink} />
        </Svg>
        <SoliActor dayType={dayType} run={run} />
      </View>
    </View>
  );
}

function Cloud({ storm }: { storm: boolean }) {
  if (!storm) {
    return (
      <Svg width={120} height={50} viewBox="0 0 120 50" style={{ position: 'absolute', left: 226, top: 18 }}>
        <Path d="M30 40h58a14 14 0 0 0 0-28 20 20 0 0 0-38-4A16 16 0 0 0 30 40z" fill={colors.textMuted} />
      </Svg>
    );
  }
  // 시안 24c: 구름 옆(아래)에 빗줄기. 구름은 약간 어둡게
  return (
    <Svg width={120} height={78} viewBox="0 0 120 78" style={{ position: 'absolute', left: 213, top: 12 }}>
      <Path d="M30 40h58a14 14 0 0 0 0-28 20 20 0 0 0-38-4A16 16 0 0 0 30 40z" fill="#6E76AE" />
      <Path d="M40 50l-6 12M58 50l-6 12M76 50l-6 12M49 64l-4 8M67 64l-4 8" stroke={colors.health} strokeWidth={2.6} strokeLinecap="round" />
    </Svg>
  );
}

function Star({ x, y, size, color, delay, period, run }: { x: number; y: number; size: number; color: string; delay: number; period: number; run: boolean }) {
  const o = useSharedValue(0.7);
  useEffect(() => {
    if (!run) {
      cancelAnimation(o);
      o.value = 0.7;
      return;
    }
    o.value = 0.25;
    o.value = withDelay(delay * 1000, withRepeat(withTiming(1, { duration: (period * 1000) / 2, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(o);
  }, [run, delay, period, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x, top: y, width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 10 10">
        <Path d="M5 0L6.1 3.9 10 5 6.1 6.1 5 10 3.9 6.1 0 5 3.9 3.9Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

/** 하루 종류에 맞는 포즈 + 움직임. 포즈 교체는 즉시(페이드 없음), 위아래 · 그림자만 부드럽게. */
function SoliActor({ dayType, run }: { dayType: DayType | null; run: boolean }) {
  const moving = dayType === 'work' || dayType === 'play';
  const [pose, setPose] = useState<SoliPoseName>(() => soliPoseFor(dayType, null));
  const y = useSharedValue(0);
  const shadowScale = useSharedValue(SHADOW_W.base / SHADOW_MAX);
  const shadowOpacity = useSharedValue(SHADOW_OPACITY.base);

  // 포즈 교대 타이머: 시작 시각 기준으로 다음 교체 시점을 계산해 어긋남이 쌓이지 않는다
  useEffect(() => {
    if (!moving || !run) {
      setPose(soliPoseFor(dayType, null));
      return;
    }
    const start = Date.now();
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const elapsed = Date.now() - start;
      setPose(soliPoseFor(dayType, elapsed));
      const wait = soliPoseDelay(dayType, elapsed);
      if (wait !== null) id = setTimeout(tick, wait);
    };
    tick();
    return () => clearTimeout(id);
  }, [dayType, moving, run]);

  // 위아래 · 그림자: 포즈가 바뀔 때 맞춰 움직인다
  useEffect(() => {
    const setShadow = (ms: number) => {
      const s = SHADOW_W[pose] / SHADOW_MAX;
      const o = SHADOW_OPACITY[pose];
      shadowScale.value = ms ? withTiming(s, { duration: ms }) : s;
      shadowOpacity.value = ms ? withTiming(o, { duration: ms }) : o;
    };
    cancelAnimation(y);
    if (dayType === 'play') {
      // 점프 동안 위로, 착지에서 내려온다
      if (pose === 'jump') y.value = run ? withTiming(-22, { duration: 170, easing: Easing.out(Easing.quad) }) : 0;
      else y.value = run ? withTiming(0, { duration: 110, easing: Easing.in(Easing.quad) }) : 0;
      setShadow(run ? 120 : 0);
      return;
    }
    setShadow(0);
    if ((dayType === null || dayType === 'rest') && run) {
      // 숨 쉬듯 위아래 1.5px, 약 3초 주기
      y.value = -1.5;
      y.value = withRepeat(withTiming(1.5, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      y.value = 0;
    }
    return () => cancelAnimation(y);
  }, [dayType, pose, run, y, shadowScale, shadowOpacity]);

  const soliStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: shadowOpacity.value, transform: [{ scaleX: shadowScale.value }] }));

  // 이 하루 종류에 쓰는 포즈만 올려 두고 보이는 쪽만 켠다 (교체마다 SVG를 다시 읽지 않는다)
  const layers: SoliPoseName[] =
    dayType === 'work' ? ['walkA', 'walkB'] : dayType === 'play' ? ['jump', 'land'] : dayType === 'rest' ? ['rest'] : ['base'];

  return (
    <>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 219, height: 12, alignItems: 'center' }} pointerEvents="none">
        <Animated.View style={[{ width: SHADOW_MAX, height: 12, borderRadius: 6, backgroundColor: '#1B3E2B' }, shadowStyle]} />
      </View>
      <Animated.View
        style={[{ position: 'absolute', left: SOLI.left, top: SOLI.top, width: SOLI.width, height: SOLI.height }, soliStyle]}
        pointerEvents="none"
      >
        {layers.map((name) => (
          <View key={`${dayType}-${name}`} style={[StyleSheet.absoluteFill, { opacity: name === pose ? 1 : 0 }]}>
            <SvgXml xml={SOLI_POSES[name]} width={SOLI.width} height={SOLI.height} />
          </View>
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden', backgroundColor: colors.cardSub },
  band: { position: 'absolute', left: -80, width: STAGE.width + 160 },
});
