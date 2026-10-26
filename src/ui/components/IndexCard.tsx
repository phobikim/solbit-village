// 지수 카드: 원형 게이지 + 이름 + 숫자(0~100) + 상태 문구 (SPEC 3장).

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SvgXml } from 'react-native-svg';

import type { IndexKind } from '../../domain/types';
import { indexIconSvg } from '../characters/icons';
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
  /** 압축(64pt): 이름을 빼고 아이콘 + 숫자 + 짧은 상태만 */
  compact?: boolean;
  /** 카드 높이 (layout.ts) */
  height?: number;
};

const SIZE = 44;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
const SMALL = 30;
const SSTROKE = 4;
const SR = (SMALL - SSTROKE) / 2;
const SCIRC = 2 * Math.PI * SR;

export function IndexCard({ kind, value, status, compact, height }: Props) {
  const col = value === null ? colors.textMuted : indexColor(kind, value);
  const v = value === null ? 0 : Math.min(100, Math.max(0, value));
  if (compact) {
    return (
      <View style={[styles.card, styles.cardCompact, height !== undefined && { height }]} accessibilityLabel={`${LABEL[kind]} ${value ?? ''}, ${status}`}>
        <View style={styles.compactRow}>
          <View style={{ width: SMALL, height: SMALL, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={SMALL} height={SMALL} style={StyleSheet.absoluteFill}>
              <Circle cx={SMALL / 2} cy={SMALL / 2} r={SR} stroke={colors.track} strokeWidth={SSTROKE} fill="none" />
              <Circle
                cx={SMALL / 2}
                cy={SMALL / 2}
                r={SR}
                stroke={col}
                strokeWidth={SSTROKE}
                fill="none"
                strokeDasharray={`${(SCIRC * v) / 100} ${SCIRC}`}
                transform={`rotate(-90 ${SMALL / 2} ${SMALL / 2})`}
              />
            </Svg>
            <SvgXml xml={indexIconSvg(kind, col, colors.cardSub)} width={13} height={13} />
          </View>
          <Text style={[styles.value, styles.valueCompact, { color: col }]}>{value === null ? '-' : v}</Text>
        </View>
        <Text style={styles.statusCompact} numberOfLines={1}>
          {status}
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.card, height !== undefined && { height, justifyContent: 'center' }]} accessibilityLabel={`${LABEL[kind]} ${value ?? ''}, ${status}`}>
      <View style={styles.gauge}>
        <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={colors.track} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={col}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${(CIRC * v) / 100} ${CIRC}`}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <SvgXml xml={indexIconSvg(kind, col, colors.cardSub)} width={18} height={18} />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{LABEL[kind]}</Text>
        <Text style={[styles.value, { color: col }]}>{value === null ? '-' : v}</Text>
      </View>
      <Text style={styles.status} numberOfLines={1}>
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.cardSub,
    borderRadius: radius.index,
    paddingTop: 9,
    paddingBottom: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 4,
  },
  gauge: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  label: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  value: { fontFamily: fonts.numberBold, fontSize: 14 },
  status: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textSub },
  cardCompact: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 4, justifyContent: 'center', gap: 2 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  valueCompact: { fontSize: 17 },
  statusCompact: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textSub, maxWidth: '100%' },
});
