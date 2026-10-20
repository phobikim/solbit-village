// 분홍 큰 버튼 ("오늘 기록하기", "밭에 심기" …)

import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    // 시안: box-shadow 0 5px 0 #B32A6E (아래 단단한 그림자)
    borderBottomWidth: 5,
    borderBottomColor: colors.pinkShadow,
    shadowColor: colors.pink,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 12 },
  },
  pressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  label: { fontFamily: fonts.title, fontSize: 20, color: colors.line },
});
