// 아래 단단한 단색 그림자가 있는 큰 둥근 버튼 (시안: box-shadow 0 5px 0). 높이 56 + 그림자 5.
// 옷 가게의 "사기 · 가격" 고정 버튼과 구매 확인 시트의 [사기]가 함께 쓴다.

import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '../theme';

export const CHUNKY_HEIGHT = 56;
export const CHUNKY_DROP = 5;

type Props = {
  label: string;
  onPress: () => void;
  /** 버튼 바탕 · 글자 · 그림자 색. 기본은 분홍 */
  bg?: string;
  ink?: string;
  drop?: string;
  style?: StyleProp<ViewStyle>;
};

export function ChunkyButton({ label, onPress, bg = colors.pink, ink = colors.line, drop = colors.pinkShadow, style }: Props) {
  return (
    <View style={[styles.slot, style]}>
      <View style={[styles.drop, { backgroundColor: drop }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.btn, { backgroundColor: bg }, pressed && styles.pressed]}
      >
        <Text style={[styles.label, { color: ink }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { height: CHUNKY_HEIGHT + CHUNKY_DROP },
  drop: { position: 'absolute', left: 0, right: 0, top: CHUNKY_DROP, height: CHUNKY_HEIGHT, borderRadius: CHUNKY_HEIGHT / 2 },
  btn: { height: CHUNKY_HEIGHT, borderRadius: CHUNKY_HEIGHT / 2, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ translateY: 3 }] },
  label: { fontFamily: fonts.title, fontSize: 20 },
});
