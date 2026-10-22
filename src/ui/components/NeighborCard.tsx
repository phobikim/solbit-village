// 이웃 목록 카드 (7c). 가까운 이웃을 부각하고, 뜸한 이웃도 경고처럼 보이지 않게 한다 (CLAUDE.md 규칙 6).

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { CLOSENESS_LABEL, RELATION_LABEL, type Relation } from '../../copy/labels.ko';
import { Face } from '../characters';
import { NEIGHBOR_COLORS } from '../characters/neighbors';
import { colors, fonts } from '../theme';
import { Avatar } from './Avatar';
import { TrashButton } from './TrashButton';

type ListedCloseness = keyof typeof CLOSENESS_LABEL;

type Props = {
  name: string;
  relation: Relation;
  /** 얼굴 0-11 */
  face: number;
  /** 배경색 0-5 */
  color: number;
  closeness: ListedCloseness;
  monthCount: number;
  bestFriend?: boolean;
  onPress?: () => void;
  /** 정리 모드: 줄 끝 휴지통 (누르면 확인 시트) */
  onDelete?: () => void;
};

/** 가까움 단계 → 막대 칸 수 · 색. 뜸함은 경고색 대신 차분한 회색 계열. */
const CLOSENESS_STYLE: Record<ListedCloseness, { segs: number; color: string }> = {
  close: { segs: 4, color: colors.relation },
  normal: { segs: 3, color: colors.yellow },
  distant: { segs: 2, color: colors.textMuted },
};

const heart = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="${colors.line}"><path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/></svg>`;

export function NeighborCard({ name, relation, face, color, closeness, monthCount, bestFriend, onPress, onDelete }: Props) {
  const cs = CLOSENESS_STYLE[closeness];
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.card, bestFriend && styles.best, pressed && styles.pressed]}
    >
      <Avatar size={52} background={bestFriend ? colors.yellow : NEIGHBOR_COLORS[color] ?? colors.night}>
        <Face face={face} size={48} />
      </Avatar>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{RELATION_LABEL[relation]}</Text>
          </View>
          {bestFriend && (
            <View style={[styles.chip, styles.bestChip]}>
              <SvgXml xml={heart} width={10} height={10} />
              <Text style={[styles.chipText, styles.bestChipText]}>단짝</Text>
            </View>
          )}
        </View>
        <View style={styles.closeRow}>
          <View style={styles.segs}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.seg, { backgroundColor: i <= cs.segs ? cs.color : colors.track }]} />
            ))}
          </View>
          <Text style={[styles.closeText, { color: cs.color }]}>{CLOSENESS_LABEL[closeness]}</Text>
        </View>
      </View>
      <View style={styles.count}>
        <Text style={[styles.countNum, bestFriend && styles.countBest]}>{monthCount}번</Text>
        <Text style={styles.countLabel}>{bestFriend ? '이번 달 만남' : '이번 달'}</Text>
      </View>
      {onDelete && <TrashButton label={name} onPress={onDelete} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSub,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  best: { borderColor: colors.pink },
  pressed: { opacity: 0.85 },
  body: { flex: 1, gap: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  chip: {
    backgroundColor: colors.track,
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textSub },
  bestChip: { backgroundColor: colors.pink },
  bestChipText: { color: colors.line },
  closeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segs: { flexDirection: 'row', gap: 3 },
  seg: { width: 16, height: 6, borderRadius: 3 },
  closeText: { fontFamily: fonts.bodyHeavy, fontSize: 12 },
  count: { alignItems: 'flex-end', gap: 2 },
  countNum: { fontFamily: fonts.number, fontSize: 17, lineHeight: 19, color: colors.text },
  countBest: { fontFamily: fonts.numberBold, fontSize: 20, lineHeight: 22, color: colors.yellow },
  countLabel: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textMuted },
});
