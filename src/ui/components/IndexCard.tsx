// 지수 카드 (SPEC 3장). 높이에 따라 세 가지 모양 (SPEC 11장 압축 단계):
// full  96pt  링 + 이름 + 숫자 + 상태 문구
// ring  72pt  링 + 이름 + 숫자 (문구 제거)
// strip 44pt  한 줄 띠: 아이콘 + 숫자 (링 없음). 지수 색은 어느 모양이든 유지한다.

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';

import type { IndexKind } from '../../domain/types';
import { indexIconSvg } from '../characters/icons';
import type { IndexVariant } from '../layout';
import { colors, fonts, radius, workColor } from '../theme';

const LABEL: Record<IndexKind, string> = {
  health: '건강',
  work: '일',
  relation: '관계',
  leisure: '쉼',
};

export function indexColor(kind: IndexKind, value: number): string {
  switch (kind) {
    case 'health':
      return colors.health;
    case 'work':
      return workColor(value);
    case 'relation':
      return colors.relation;
    case 'leisure':
      return colors.leisure;
  }
}

type Props = {
  kind: IndexKind;
  /** 계산할 기록이 없으면 null */
  value: number | null;
  status: string;
  variant?: IndexVariant;
  /** 카드 높이 (layout.ts) */
  height?: number;
};

/** 링 하나: 크기 · 두께 · 안쪽 아이콘 크기 */
const RING = {
  full: { size: 44, stroke: 6, icon: 18 },
  ring: { size: 36, stroke: 5, icon: 15 },
} as const;

function Ring({ kind, col, v, spec }: { kind: IndexKind; col: string; v: number; spec: { size: number; stroke: number; icon: number } }) {
  const r = (spec.size - spec.stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <View style={{ width: spec.size, height: spec.size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={spec.size} height={spec.size} style={StyleSheet.absoluteFill}>
        <Circle cx={spec.size / 2} cy={spec.size / 2} r={r} stroke={colors.track} strokeWidth={spec.stroke} fill="none" />
        <Circle
          cx={spec.size / 2}
          cy={spec.size / 2}
          r={r}
          stroke={col}
          strokeWidth={spec.stroke}
          fill="none"
          strokeDasharray={`${(circ * v) / 100} ${circ}`}
          transform={`rotate(-90 ${spec.size / 2} ${spec.size / 2})`}
        />
      </Svg>
      <SvgXml xml={indexIconSvg(kind, col, colors.cardSub)} width={spec.icon} height={spec.icon} />
    </View>
  );
}

export function IndexCard({ kind, value, status, variant = 'full', height }: Props) {
  const col = value === null ? colors.textMuted : indexColor(kind, value);
  const v = value === null ? 0 : Math.min(100, Math.max(0, value));
  const shown = value === null ? '-' : v;
  const a11y = `${LABEL[kind]} ${value ?? ''}, ${status}`;

  if (variant === 'strip') {
    return (
      <View style={[styles.card, styles.strip, height !== undefined && { height }]} accessibilityLabel={a11y}>
        <SvgXml xml={indexIconSvg(kind, col, colors.cardSub)} width={20} height={20} />
        <Text style={[styles.stripValue, { color: col }]}>{shown}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.stack, height !== undefined && { height }]} accessibilityLabel={a11y}>
      <Ring kind={kind} col={col} v={v} spec={RING[variant]} />
      <View style={styles.row}>
        <Text style={styles.label}>{LABEL[kind]}</Text>
        <Text style={[styles.value, { color: col }]}>{shown}</Text>
      </View>
      {variant === 'full' && (
        <Text style={styles.status} numberOfLines={1}>
          {status}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.cardSub,
    borderRadius: radius.index,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: { gap: 4 },
  strip: { flexDirection: 'row', gap: 6 },
  stripValue: { fontFamily: fonts.numberBold, fontSize: 20, lineHeight: 24 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  value: { fontFamily: fonts.numberBold, fontSize: 14 },
  status: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
});
