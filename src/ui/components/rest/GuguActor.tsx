// 구구 할매 (쉼터 풍경 안, 디자인 "5 쉼터 v2" 1a): 몸통 · 고개 · 눈꺼풀을 따로 움직인다 (움직임 값은 guguMotion.ts).
// 쉼터 풍경 칸(366 x 280 도면)의 GUGU_BOX 자리에 scale 배로 얹는다. 시스템 "동작 줄이기"가 켜져 있으면 가만히 있는다.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { FireMood } from '../../../domain/fire';
import { GUGU_BODY_PIVOT, GUGU_HEAD_PIVOT, GUGU_VIEWBOX, guguBaseInner, guguHeadInner, guguLidsInner } from '../../characters/gugu';
import { guguMotion, type Track } from '../../characters/guguMotion';
import { GUGU_BOX } from '../../characters/restScene';

const svg = (inner: string) => {
  const v = GUGU_VIEWBOX;
  return `<svg viewBox="${v.x} ${v.y} ${v.w} ${v.h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
};

/** 0→1을 되풀이하는 값 하나. 웹은 네이티브 드라이버가 변형(transform)을 못 움직여서 JS 드라이버를 쓴다 */
function useLoop(duration: number, run: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    if (!run) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [v, duration, run]);
  return v;
}

const interp = (v: Animated.Value, t: Track, unit = 1, suffix = '') =>
  v.interpolate({ inputRange: [...t.input], outputRange: t.output.map((n) => (suffix ? `${n * unit}${suffix}` : (n * unit) as unknown as string)) as never });

export function GuguActor({ mood, scale }: { mood: FireMood; scale: number }) {
  const [still, setStill] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => alive && setStill(on)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const m = useMemo(() => guguMotion(mood), [mood]);
  const w = GUGU_BOX.w * scale;
  const h = GUGU_BOX.h * scale;
  // viewBox → 화면 배율과 가운데 맞춤 (meet)
  const vb = GUGU_VIEWBOX;
  const k = Math.min(w / vb.w, h / vb.h);
  const padX = (w - vb.w * k) / 2;
  const padY = (h - vb.h * k) / 2;
  const px = (p: { x: number; y: number }) => `${(p.x - vb.x) * k + padX}px ${(p.y - vb.y) * k + padY}px`;

  const body = useLoop(m.body.track.duration, !still);
  const head = useLoop(m.head?.duration ?? 1000, !still && !!m.head);
  const blink = useLoop(m.blink?.duration ?? 1000, !still && !!m.blink);

  const base = useMemo(() => svg(guguBaseInner(mood)), [mood]);
  const headXml = useMemo(() => svg(guguHeadInner(mood)), [mood]);
  const lidsInner = useMemo(() => guguLidsInner(mood), [mood]);

  const bodyStyle =
    m.body.kind === 'rotate'
      ? { transformOrigin: px(GUGU_BODY_PIVOT), transform: [{ rotate: interp(body, m.body.track, 1, 'deg') }] }
      : m.body.kind === 'translateX'
        ? { transform: [{ translateX: interp(body, m.body.track, k) }] }
        : { transform: [{ translateY: interp(body, m.body.track, k) }] };

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.abs, { left: GUGU_BOX.x * scale, top: GUGU_BOX.y * scale, width: w, height: h }, still ? null : (bodyStyle as never)]}
    >
      <SvgXml xml={base} width={w} height={h} />
      <Animated.View
        style={[styles.fill, m.head && !still ? ({ transformOrigin: px(GUGU_HEAD_PIVOT), transform: [{ rotate: interp(head, m.head, 1, 'deg') }] } as never) : null]}
      >
        <SvgXml xml={headXml} width={w} height={h} />
        {lidsInner && m.blink && !still && (
          <Animated.View style={[styles.fill, { opacity: interp(blink, m.blink) as never }]}>
            <SvgXml xml={svg(lidsInner)} width={w} height={h} />
          </Animated.View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 },
});

