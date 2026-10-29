// 오늘 하루 고르기의 장면 카드 (디자인 v5 26a~c): 밤바다 위 작은 섬 + 솔이.
// 그림은 366×318 좌표계(stage)에 그려 카드 크기에 맞게 줄인다. 움직이는 객체: 별 6 + 솔이 1 + 풍선 1 + 바닥 그림자 1 (transform / opacity만).

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

import { balloonTilt, soliPoseDelay, soliPoseFor, type DayType, type SoliPoseName } from '../../domain/morning';
import { SOLI_POSES, SOLI_POSE_VIEWBOX, SOLI_PROP_BALLOON } from '../characters/soliPoses';
import { colors } from '../theme';

const STAGE = { width: 366, height: 318 } as const;
/** 솔이 그림 자리 (시안: left 85 · top 21 · 196×235) */
const SOLI = { left: 85, top: 21, width: 196, height: (196 * SOLI_POSE_VIEWBOX.height) / SOLI_POSE_VIEWBOX.width } as const;
/** 풍선 소품 자리 (시안: left 230 · top 15 · 78×118). 끈 끝(아래 96.7%)을 축으로 흔들린다 */
const BALLOON = { left: 230, top: 15, width: 78, height: 118, pivotY: 0.967 } as const;
const BALLOON_PIVOT_OFFSET = BALLOON.height * (BALLOON.pivotY - 0.5);
/** 솔이가 공중에 뜰 때 올라가는 높이 */
const HOP_RISE = 10;
const SHADOW_MAX = 116;

// [x, y, 크기, 색, 지연(초)] — 시안 8개 중 6개 (움직이는 별은 최대 6개)
const STARS: readonly (readonly [number, number, number, string, number])[] = [
  [28, 26, 10, colors.yellow, 0],
  [72, 70, 6, '#FFFFFF', 1.2],
  [40, 132, 7, '#FFFFFF', 0.5],
  [196, 22, 8, colors.yellow, 1.8],
  [330, 104, 6, '#FFFFFF', 0.9],
  [334, 190, 7, colors.yellow, 1.5],
];

/** 포즈별 바닥 그림자 너비 (시안): 공중은 작고 옅게, 착지는 크게 */
function shadowFor(pose: SoliPoseName, airborne: boolean): { width: number; opacity: number } {
  if (airborne) return { width: 64, opacity: 0.45 };
  return { width: pose === 'balloonB' ? 116 : 102, opacity: 1 };
}

type Props = {
  width: number;
  height: number;
  dayType: DayType | null;
  /** 화면이 앞에 있을 때만 움직인다 */
  active: boolean;
  /** 모션 줄이기 */
  reduceMotion: boolean;
};

export function MorningScene({ width, height, dayType, active, reduceMotion }: Props) {
  const scale = Math.min(width / STAGE.width, height / STAGE.height);
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
        {STARS.map(([x, y, s, c, d], i) => (
          <Star key={i} x={x} y={y} size={s} color={c} delay={d} period={2.6 + (i % 3) * 0.7} run={run} />
        ))}
        <Svg width={366} height={40} viewBox="0 0 366 40" style={{ position: 'absolute', left: 0, top: 244 }} fill="none" stroke="#4A5290" strokeWidth={2.4} strokeLinecap="round">
          <Path d="M34 14c6-5 12-5 18 0s12 5 18 0" />
          <Path d="M296 12c6-5 12-5 18 0s12 5 18 0" />
          <Path d="M150 32c6-5 12-5 18 0s12 5 18 0s12 5 18 0" />
        </Svg>
        <View style={{ position: 'absolute', left: 63, top: 244, width: 240, height: 26, borderRadius: 13, backgroundColor: '#24543A' }} />
        <View style={{ position: 'absolute', left: 63, top: 228, width: 240, height: 34, borderRadius: 17, backgroundColor: '#2F6B4A' }} />
        <Svg width={40} height={58} viewBox="0 0 40 58" style={{ position: 'absolute', left: 74, top: 184 }}>
          <Rect x={17.5} y={30} width={5} height={26} rx={2.5} fill="#7A5A3A" />
          <Circle cx={20} cy={20} r={15} fill="#3F8A5C" />
          <Circle cx={14} cy={28} r={9} fill="#3F8A5C" />
          <Circle cx={27} cy={28} r={9} fill="#3F8A5C" />
        </Svg>
        <Svg width={22} height={30} viewBox="0 0 26 32" style={{ position: 'absolute', left: 270, top: 214 }}>
          <Rect x={3} y={2} width={2.6} height={29} rx={1.3} fill="#FFFFFF" />
          <Path d="M5.6 3h17l-4 5 4 5h-17z" fill={colors.pink} />
        </Svg>
        <SoliActor dayType={dayType} run={run} />
      </View>
    </View>
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

/** 풍선이 솔이보다 약간 늦게, 살짝 튕기며 따라 오른다 (시안: .45s cubic-bezier(.3,1.4,.5,1) .08s) */
const BALLOON_EASE = Easing.bezier(0.3, 1.4, 0.5, 1);

/** 하루 종류에 맞는 포즈 + 움직임. 포즈 교체는 즉시(페이드 없음), 위아래 · 그림자 · 풍선만 부드럽게. */
function SoliActor({ dayType, run }: { dayType: DayType | null; run: boolean }) {
  const moving = dayType !== null;
  const [pose, setPose] = useState<SoliPoseName>(() => soliPoseFor(dayType, null));
  const [tilt, setTilt] = useState(0);
  const y = useSharedValue(0);
  const balloonY = useSharedValue(0);
  const balloonRot = useSharedValue(0);
  const shadowScale = useSharedValue(102 / SHADOW_MAX);
  const shadowOpacity = useSharedValue(1);

  // 포즈 교대 타이머: 시작 시각 기준으로 다음 교체 시점을 계산해 어긋남이 쌓이지 않는다
  useEffect(() => {
    if (!moving || !run) {
      setPose(soliPoseFor(dayType, null));
      setTilt(0);
      return;
    }
    const start = Date.now();
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      const elapsed = Date.now() - start;
      setPose(soliPoseFor(dayType, elapsed));
      setTilt(dayType === 'play' ? balloonTilt(elapsed) : 0);
      const wait = soliPoseDelay(dayType, elapsed);
      if (wait !== null) id = setTimeout(tick, wait);
    };
    tick();
    return () => clearTimeout(id);
  }, [dayType, moving, run]);

  // 위아래 · 그림자 · 풍선: 포즈가 바뀔 때 맞춰 움직인다
  const airborne = dayType === 'play' && run && pose === 'balloonA';
  useEffect(() => {
    const sh = shadowFor(pose, airborne);
    const s = sh.width / SHADOW_MAX;
    shadowScale.value = run ? withTiming(s, { duration: 200 }) : s;
    shadowOpacity.value = run ? withTiming(sh.opacity, { duration: 200 }) : sh.opacity;

    cancelAnimation(y);
    if (dayType === 'play') {
      const rise = airborne ? -HOP_RISE : 0;
      y.value = run ? withTiming(rise, { duration: 180, easing: Easing.out(Easing.quad) }) : 0;
      balloonY.value = run ? withDelay(80, withTiming(rise, { duration: 450, easing: BALLOON_EASE })) : 0;
      balloonRot.value = run ? withDelay(80, withTiming(tilt, { duration: 450, easing: BALLOON_EASE })) : 0;
      return;
    }
    balloonY.value = 0;
    balloonRot.value = 0;
    if (dayType === null && run) {
      // 숨 쉬듯 위아래 1.5px, 약 3초 주기
      y.value = -1.5;
      y.value = withRepeat(withTiming(1.5, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
    } else {
      y.value = 0;
    }
    return () => cancelAnimation(y);
  }, [dayType, pose, tilt, airborne, run, y, balloonY, balloonRot, shadowScale, shadowOpacity]);

  const soliStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const shadowStyle = useAnimatedStyle(() => ({ opacity: shadowOpacity.value, transform: [{ scaleX: shadowScale.value }] }));
  // 풍선은 끈 끝을 축으로 돌린다: 축으로 옮기고 → 돌리고 → 되돌린다
  const balloonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: balloonY.value }, { translateY: BALLOON_PIVOT_OFFSET }, { rotate: `${balloonRot.value}deg` }, { translateY: -BALLOON_PIVOT_OFFSET }],
  }));

  // 이 하루 종류에 쓰는 포즈만 올려 두고 보이는 쪽만 켠다 (교체마다 SVG를 다시 읽지 않는다)
  const layers: SoliPoseName[] = dayType === 'work' ? ['walkA', 'walkB'] : dayType === 'play' ? ['balloonA', 'balloonB'] : ['base'];

  return (
    <>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 238, height: 12, alignItems: 'center' }} pointerEvents="none">
        <Animated.View style={[{ width: SHADOW_MAX, height: 12, borderRadius: 6, backgroundColor: '#1B3E2B' }, shadowStyle]} />
      </View>
      {dayType === 'play' && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: BALLOON.left, top: BALLOON.top, width: BALLOON.width, height: BALLOON.height }, balloonStyle]}
        >
          <SvgXml xml={SOLI_PROP_BALLOON} width={BALLOON.width} height={BALLOON.height} />
        </Animated.View>
      )}
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
