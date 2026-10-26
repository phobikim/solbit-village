// 마을 경험치 성장 바

import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';

type Props = { current: number; goal: number; height?: number };

const fmt = (n: number) => n.toLocaleString('en-US');

export function LevelBar({ current, goal, height = 26 }: Props) {
  const pct = goal > 0 ? Math.min(1, Math.max(0, current / goal)) : 0;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]} accessibilityLabel={`마을 경험치 ${current} / ${goal}`}>
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
      <Text style={styles.text}>
        {fmt(current)} / {fmt(goal)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.barTrack,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 13, backgroundColor: colors.yellow },
  text: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    fontFamily: fonts.number,
    fontSize: 12,
    color: colors.text,
  },
});
