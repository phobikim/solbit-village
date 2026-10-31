// 오늘 하루 고르기의 선택 알약 + 오늘의 보상 카드 (디자인 TURN 29 "일할까, 놀까" 개정).
// 일 · 놀기 두 알약(높이 56, 가로 2열). 한 번에 하나, 눌러서 다시 바꿀 수 있다. 고른 알약은 분류 색으로 채워지고 위로 3 올라온다.
// 알약 아래 "오늘의 보상" 카드: 고르기 전에는 "골라보슈 · ?", 고르면 월급 +100 / 흥 +10. 오른쪽 칸에 "저녁 기록 저장 시 지급".
// 보상 숫자는 도메인(rewards.ts)에서 받아 그리기만 한다. 지급은 아직 하지 않는다.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';

import {
  DAY_LABEL,
  DAY_REWARD_LABEL,
  REWARD_CARD_A11Y,
  REWARD_PAYOUT,
  REWARD_UNPICKED_LABEL,
  REWARD_UNPICKED_VALUE,
  rewardValue,
  TODAY_REWARD,
} from '../../copy/morning.ko';
import { DAY_TYPES, type DayType } from '../../domain/morning';
import { ICON_COIN, ICON_HEUNG } from '../characters/rewardIcons';
import { colors, fonts } from '../theme';

const INK = colors.line;

const DAY_ICON: Record<DayType, { chip: string; paths: readonly string[]; reward: string; tint: string; rot: number }> = {
  work: {
    chip: colors.workLow,
    paths: ['M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'M3 13h18'],
    reward: ICON_COIN,
    tint: '#3A3550',
    rot: -8,
  },
  play: {
    chip: colors.relation,
    paths: ['M12 2.5c3.6 0 6 2.8 6 6.4 0 4.2-3 7.6-6 7.6s-6-3.4-6-7.6c0-3.6 2.4-6.4 6-6.4z', 'M11 16.5h2l-1 1.5z', 'M12 18c-1.6 1.4 1.6 2.2 0 3.6'],
    reward: ICON_HEUNG,
    tint: '#2C4A3E',
    rot: 8,
  },
};

/** 알약 색: 고르지 않음 / 고름 (시안: 고르면 분류 색 채움 + 진한 테두리 + 아래 단단한 그림자 5) */
const OFF = { bg: colors.card, ink: colors.text, ring: '#343D78', ringW: 2, drop: '#181F4C', dropH: 4 };

type Props = {
  value: DayType | null;
  onPick: (d: DayType) => void;
};

export function DayCards({ value, onPick }: Props) {
  return (
    <View style={styles.row}>
      {DAY_TYPES.map((d) => {
        const on = value === d;
        const ico = DAY_ICON[d];
        const c = on ? { bg: ico.chip, ink: INK, ring: INK, ringW: 3, drop: INK, dropH: 5 } : OFF;
        return (
          <View key={d} style={[styles.slot, on && { transform: [{ translateY: -3 }] }]}>
            <View style={[styles.drop, { backgroundColor: c.drop, top: c.dropH }]} />
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              accessibilityLabel={DAY_LABEL[d]}
              onPress={() => onPick(d)}
              style={[styles.pill, { backgroundColor: c.bg, borderColor: c.ring, borderWidth: c.ringW }]}
            >
              <View style={[styles.disc, { backgroundColor: on ? '#FFFFFF' : ico.chip }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  {ico.paths.map((p) => (
                    <Path key={p} d={p} />
                  ))}
                </Svg>
              </View>
              <Text style={[styles.name, { color: c.ink }]}>{DAY_LABEL[d]}</Text>
              <View style={[styles.check, { opacity: on ? 1 : 0 }]}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={ico.chip} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12.5l4.5 4.5L19 7.5" />
                </Svg>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

/** 오늘의 보상 카드: 하루를 고르면 그 보상, 아니면 "골라보슈 · ?" */
export function RewardCard({ value, rewards }: { value: DayType | null; rewards: Record<DayType, number> }) {
  const ico = value ? DAY_ICON[value] : null;
  const label = value ? DAY_REWARD_LABEL[value] : REWARD_UNPICKED_LABEL;
  const val = value ? rewardValue(rewards[value]) : REWARD_UNPICKED_VALUE;
  const chip = ico?.chip ?? '#4A5290';
  return (
    <View style={styles.reward} accessible accessibilityLabel={REWARD_CARD_A11Y(label, val)}>
      <View style={styles.rewardMain}>
        <View style={[styles.tile, { backgroundColor: ico?.tint ?? colors.card, borderColor: ico ? chip : '#343D78' }]}>
          <View style={{ opacity: ico ? 1 : 0.35, transform: [{ rotate: `${ico?.rot ?? 0}deg` }] }}>
            <SvgXml xml={ico?.reward ?? ICON_COIN} width={42} height={42} />
          </View>
          <Sparkle size={14} color={colors.yellow} style={{ right: -4, top: -4, opacity: ico ? 1 : 0.35 }} />
          <Sparkle size={9} color="#FFFFFF" style={{ left: -3, bottom: 6, opacity: ico ? 1 : 0.35 }} />
        </View>
        <View style={styles.rewardText}>
          <Text style={styles.rewardTitle}>{TODAY_REWARD}</Text>
          <View style={styles.rewardLine}>
            <View style={[styles.rewardChip, { backgroundColor: ico ? chip : '#2E3775' }]}>
              <Text style={[styles.rewardChipText, { color: ico ? INK : colors.textMuted }]}>{label}</Text>
            </View>
            <Text style={[styles.rewardValue, { color: ico ? chip : '#4A5290' }]}>{val}</Text>
          </View>
        </View>
      </View>
      <View style={styles.payout}>
        <Svg width={20} height={20} viewBox="0 0 24 24">
          <Path d="M15 3a9 9 0 1 0 6 15A7.5 7.5 0 0 1 15 3z" fill={colors.yellow} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
        <Text style={styles.payoutText}>
          {REWARD_PAYOUT[0]}
          {'\n'}
          {REWARD_PAYOUT[1]}
        </Text>
      </View>
      {/* 티켓 모양 홈: 점선 위아래 */}
      <View style={[styles.notch, { top: -9 }]} />
      <View style={[styles.notch, { bottom: -9 }]} />
    </View>
  );
}

function Sparkle({ size, color, style }: { size: number; color: string; style: object }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={[{ position: 'absolute' }, style]}>
      <Path d="M12 1Q12 12 23 12Q12 12 12 23Q12 12 1 12Q12 12 12 1Z" fill={color} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  slot: { flex: 1, height: 56 },
  // 시안: box-shadow 0 5px 0 (아래 단단한 단색 그림자) — 알약과 같은 크기의 판을 아래로 밀어 깐다
  drop: { position: 'absolute', left: 0, right: 0, height: 56, borderRadius: 28 },
  pill: { height: 56, borderRadius: 28, paddingLeft: 8, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  disc: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.title, fontSize: 20, lineHeight: 24 },
  check: { marginLeft: 'auto', width: 22, height: 22, borderRadius: 11, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },

  reward: { height: 96, borderRadius: 22, backgroundColor: colors.cardSub, borderWidth: 2, borderColor: '#2B3370', flexDirection: 'row' },
  rewardMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14 },
  tile: { width: 64, height: 64, borderRadius: 20, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center' },
  rewardText: { gap: 6, minWidth: 0 },
  rewardTitle: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textMuted },
  rewardLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardChip: { height: 24, paddingHorizontal: 9, borderRadius: 12, justifyContent: 'center' },
  rewardChipText: { fontFamily: fonts.bodyHeavy, fontSize: 12 },
  rewardValue: { fontFamily: fonts.numberBold, fontSize: 30, lineHeight: 32 },
  payout: { width: 78, borderLeftWidth: 2, borderLeftColor: '#343D78', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 5 },
  payoutText: { fontFamily: fonts.bodyHeavy, fontSize: 11, lineHeight: 14, color: colors.textSub, textAlign: 'center' },
  notch: { position: 'absolute', right: 69, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.night },
});
