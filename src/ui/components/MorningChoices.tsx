// 오늘 하루 고르기의 선택 카드 (디자인 v5 26a~c): 일 · 놀기 두 칸, 가로 2열. 한 번에 하나, 눌러서 다시 바꿀 수 있다.
// 카드마다 이름 / 구분선 / 받을 보상(예정) 줄. 보상 숫자는 도메인(rewards.ts)에서 받아 그리기만 한다.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';

import { dayCardA11y, DAY_LABEL, DAY_REWARD_LABEL, rewardValue } from '../../copy/morning.ko';
import { DAY_TYPES, type DayType } from '../../domain/morning';
import { ICON_COIN, ICON_ENERGY } from '../characters/rewardIcons';
import { colors, fonts } from '../theme';

const INK = colors.line;

const DAY_ICON: Record<DayType, { chip: string; paths: readonly string[]; reward: string }> = {
  work: {
    chip: colors.workLow,
    paths: ['M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'M3 13h18'],
    reward: ICON_COIN,
  },
  play: {
    chip: colors.relation,
    paths: ['M12 2.5c3.6 0 6 2.8 6 6.4 0 4.2-3 7.6-6 7.6s-6-3.4-6-7.6c0-3.6 2.4-6.4 6-6.4z', 'M11 16.5h2l-1 1.5z', 'M12 18c-1.6 1.4 1.6 2.2 0 3.6'],
    reward: ICON_ENERGY,
  },
};

// 시안: 고르지 않은 카드 / 고른 카드(노랑 채움) 색
const OFF = { bg: colors.card, ink: colors.text, sub: colors.textSub, line: '#343D78', drop: colors.cardMuted };
const ON = { bg: colors.yellow, ink: INK, sub: INK, line: '#E0C22E', drop: '#C9A800' };

type Props = {
  value: DayType | null;
  onPick: (d: DayType) => void;
  /** 카드 높이 (기본 150, 작은 화면 124) */
  height: number;
  /** 지금 마을 레벨 기준 보상 숫자 */
  rewards: Record<DayType, number>;
};

export function DayCards({ value, onPick, height, rewards }: Props) {
  const compact = height < 140;
  return (
    <View style={styles.row}>
      {DAY_TYPES.map((d) => {
        const on = value === d;
        const c = on ? ON : OFF;
        const ico = DAY_ICON[d];
        return (
          <Pressable
            key={d}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={dayCardA11y(d, rewards[d])}
            onPress={() => onPick(d)}
            style={[styles.card, { height, backgroundColor: c.bg, borderBottomColor: c.drop, gap: compact ? 8 : 12 }]}
          >
            <View style={styles.head}>
              <View style={[styles.chip, { backgroundColor: ico.chip }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  {ico.paths.map((p) => (
                    <Path key={p} d={p} />
                  ))}
                </Svg>
              </View>
              <Text style={[styles.name, { color: c.ink }]}>{DAY_LABEL[d]}</Text>
            </View>
            <View style={[styles.line, { backgroundColor: c.line }]} />
            <View style={styles.reward}>
              <SvgXml xml={ico.reward} width={compact ? 30 : 36} height={compact ? 30 : 36} />
              <View style={styles.rewardText}>
                <Text style={[styles.rewardLabel, { color: c.sub }]}>{DAY_REWARD_LABEL[d]}</Text>
                <Text style={[styles.rewardValue, { color: c.ink, fontSize: compact ? 24 : 28 }]}>{rewardValue(rewards[d])}</Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 14,
    // 시안: box-shadow 0 4px 0 (아래 단단한 단색 그림자)
    borderBottomWidth: 4,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chip: { width: 40, height: 40, borderRadius: 13, borderWidth: 2.5, borderColor: INK, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bodyHeavy, fontSize: 22 },
  line: { height: 2, borderRadius: 1 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rewardText: { gap: 3 },
  rewardLabel: { fontFamily: fonts.bodyHeavy, fontSize: 12 },
  rewardValue: { fontFamily: fonts.numberBold, lineHeight: 30 },
});
