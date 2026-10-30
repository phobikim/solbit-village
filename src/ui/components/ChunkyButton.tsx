// 아래 단단한 단색 그림자가 있는 큰 둥근 버튼 (시안: box-shadow 0 5px 0). 높이 56 + 그림자 5.
// 옷장 탭 하단 액션 버튼(구매하기 · 갈아입기 · 착용 중 …)이 쓴다. disabled면 눌러도 아무 일도 없고 눌림 모션도 없다.

import type { ReactNode } from 'react';
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
  /** 글자와 다른 읽기 라벨이 필요할 때 (체크 표시 등) */
  a11yLabel?: string;
  /** 글자 앞에 놓는 것 (체크 아이콘 등) */
  leading?: ReactNode;
  /** 안쪽 링 색 (비활성 버튼) */
  ring?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ChunkyButton({ label, onPress, bg = colors.pink, ink = colors.line, drop = colors.pinkShadow, a11yLabel, leading, ring, disabled = false, style }: Props) {
  return (
    <View style={[styles.slot, style]}>
      <View style={[styles.drop, { backgroundColor: drop }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel ?? label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.btn, { backgroundColor: bg }, ring ? { borderWidth: 2, borderColor: ring } : null, pressed && !disabled && styles.pressed]}
      >
        {leading}
        <Text style={[styles.label, { color: ink }]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { height: CHUNKY_HEIGHT + CHUNKY_DROP },
  drop: { position: 'absolute', left: 0, right: 0, top: CHUNKY_DROP, height: CHUNKY_HEIGHT, borderRadius: CHUNKY_HEIGHT / 2 },
  btn: { height: CHUNKY_HEIGHT, borderRadius: CHUNKY_HEIGHT / 2, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ translateY: 3 }] },
  label: { fontFamily: fonts.title, fontSize: 19 },
});
