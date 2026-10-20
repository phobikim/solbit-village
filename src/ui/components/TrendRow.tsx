// 최근 4주 추세 한 줄: 영역 이름 · 꺾은선 · 요약 문구 (7d)

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import type { IndexKind } from '../../domain/types';
import { colors, fonts } from '../theme';
import { indexColor } from './IndexCard';

const LABEL: Record<IndexKind, string> = { health: '건강', work: '일', relation: '관계', leisure: '여가' };

/** values: 오래된 주 → 이번 주, 기록 없는 주는 null */
type Props = { kind: IndexKind; values: readonly (number | null)[]; summary: string };

const VB_W = 140;
const VB_H = 44;
const PAD = 10;

/** 0~100 값을 꺾은선 path로. 위가 높은 값. 기록 없는 주(null)는 건너뛰고 잇는다. */
function linePath(values: readonly (number | null)[]): string {
  const step = values.length > 1 ? (VB_W - PAD * 2) / (values.length - 1) : 0;
  const pts = values
    .map((v, i) => (v === null ? null : { x: PAD + step * i, y: VB_H - 4 - (Math.min(100, Math.max(0, v)) / 100) * (VB_H - 8) }))
    .filter((p): p is { x: number; y: number } => p !== null);
  if (pts.length === 1) pts.push({ x: pts[0].x + 0.1, y: pts[0].y });
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
}

export function TrendRow({ kind, values, summary }: Props) {
  // 일 지수는 이번 주 값으로 색을 정한다 (높을수록 빨강)
  const last = [...values].reverse().find((v): v is number => v !== null);
  const col = last === undefined ? colors.textMuted : indexColor(kind, last);
  return (
    <View style={styles.row} accessibilityLabel={`${LABEL[kind]} ${summary}`}>
      <Text style={styles.label}>{LABEL[kind]}</Text>
      <Svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" width="100%" height={36} style={styles.chart}>
        <Path d={linePath(values)} stroke={col} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={[styles.summary, { color: col }]}>{summary}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 36 },
  label: { width: 44, fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  chart: { flex: 1 },
  summary: { width: 64, textAlign: 'right', fontFamily: fonts.bodyHeavy, fontSize: 12 },
});
