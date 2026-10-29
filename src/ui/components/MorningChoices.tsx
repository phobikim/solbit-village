// 오늘 하루 고르기의 선택 카드 (디자인 v4 25b~25e): 하루 종류 3칸 · 컨디션 5칸. 한 번에 하나, 같은 걸 다시 눌러도 해제하지 않는다.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CONDITION_LABEL, DAY_LABEL } from '../../copy/morning.ko';
import { DAY_TYPES, MORNING_CONDITIONS, type DayType, type MorningCondition } from '../../domain/morning';
import { colors, fonts } from '../theme';

const INK = colors.line;
const CLOUD = 'M8 22h16a5 5 0 0 0 0-10 7.5 7.5 0 0 0-14.3-1.8A6 6 0 0 0 8 22z';

const DAY_ICON: Record<DayType, { chip: string; paths: readonly string[] }> = {
  work: {
    chip: colors.workLow,
    paths: ['M4 8h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z', 'M9 8V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2', 'M3 13h18'],
  },
  rest: {
    chip: colors.leisure,
    paths: ['M4 10h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z', 'M17 11h1.5a2.5 2.5 0 0 1 0 5H17', 'M8 3v3', 'M12 3v3', 'M3 21.5h15'],
  },
  play: {
    chip: colors.relation,
    paths: ['M12 2.5c3.6 0 6 2.8 6 6.4 0 4.2-3 7.6-6 7.6s-6-3.4-6-7.6c0-3.6 2.4-6.4 6-6.4z', 'M11 16.5h2l-1 1.5z', 'M12 18c-1.6 1.4 1.6 2.2 0 3.6'],
  },
};

type CondPath = { d: string; fill: string; stroke: string };
const COND_ICON: Record<MorningCondition, readonly CondPath[]> = {
  sunny: [
    { d: 'M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M6.8 25.2l2.1-2.1M23.1 8.9l2.1-2.1', fill: 'none', stroke: colors.yellow },
    { d: 'M16 9.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z', fill: colors.yellow, stroke: INK },
  ],
  partly: [
    { d: 'M12 5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11z', fill: colors.yellow, stroke: INK },
    { d: 'M12 27h13a4.5 4.5 0 0 0 0-9 6.5 6.5 0 0 0-12.3-1.5A5.2 5.2 0 0 0 12 27z', fill: colors.textSub, stroke: INK },
  ],
  cloudy: [{ d: 'M7 25h17a5.5 5.5 0 0 0 0-11 8 8 0 0 0-15.3-2A6.5 6.5 0 0 0 7 25z', fill: colors.textSub, stroke: INK }],
  rain: [
    { d: CLOUD, fill: colors.textSub, stroke: INK },
    {
      d: 'M11 25.5c-1.2 1.8-1.2 3.2 0 3.2s1.2-1.4 0-3.2zM16.5 25.5c-1.2 1.8-1.2 3.2 0 3.2s1.2-1.4 0-3.2zM22 25.5c-1.2 1.8-1.2 3.2 0 3.2s1.2-1.4 0-3.2z',
      fill: colors.health,
      stroke: 'none',
    },
  ],
  storm: [
    { d: CLOUD, fill: colors.leisure, stroke: INK },
    { d: 'M17.5 18.5l-4 6h3.5l-2 5.5 6-7.5H17.5l2-4z', fill: colors.yellow, stroke: INK },
  ],
};

/** 노랑 위에서 연한 색이 묻히지 않게, 선택된 칸의 아이콘 색을 진하게 (시안) */
const ON_FILL: Record<string, string> = {
  [colors.yellow]: '#FFA51F',
  [colors.textSub]: '#FFFFFF',
  [colors.health]: '#2E9BD6',
  [colors.leisure]: '#9A6BEA',
};

export function DayCards({ value, onPick, height }: { value: DayType | null; onPick: (d: DayType) => void; height: number }) {
  return (
    <View style={styles.row3}>
      {DAY_TYPES.map((d) => {
        const on = value === d;
        const ico = DAY_ICON[d];
        return (
          <Pressable
            key={d}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={DAY_LABEL[d]}
            onPress={() => onPick(d)}
            style={[styles.day, { height }, on && styles.on]}
          >
            <View style={[styles.chip, { backgroundColor: ico.chip }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                {ico.paths.map((p) => (
                  <Path key={p} d={p} />
                ))}
              </Svg>
            </View>
            <Text style={[styles.dayLabel, on && styles.onText]}>{DAY_LABEL[d]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ConditionCards({ value, onPick, height }: { value: MorningCondition | null; onPick: (c: MorningCondition) => void; height: number }) {
  return (
    <View style={styles.row5}>
      {MORNING_CONDITIONS.map((c) => {
        const on = value === c;
        return (
          <Pressable
            key={c}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={CONDITION_LABEL[c]}
            onPress={() => onPick(c)}
            style={[styles.cond, { height }, on && styles.on]}
          >
            <Svg width={30} height={30} viewBox="0 0 32 32" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              {COND_ICON[c].map((p) => (
                <Path key={p.d} d={p.d} fill={on ? (ON_FILL[p.fill] ?? p.fill) : p.fill} stroke={on ? INK : p.stroke} />
              ))}
            </Svg>
            <Text style={[styles.condLabel, on && styles.onText]}>{CONDITION_LABEL[c]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row3: { flexDirection: 'row', gap: 8 },
  row5: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, borderRadius: 22, backgroundColor: colors.card, padding: 12, justifyContent: 'space-between', alignItems: 'flex-start' },
  cond: { flex: 1, borderRadius: 18, backgroundColor: colors.card, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 5 },
  on: { backgroundColor: colors.yellow },
  onText: { color: INK },
  chip: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontFamily: fonts.bodyHeavy, fontSize: 16, color: colors.text },
  condLabel: { fontFamily: fonts.bodyHeavy, fontSize: 12, lineHeight: 14, textAlign: 'center', color: colors.text },
});
