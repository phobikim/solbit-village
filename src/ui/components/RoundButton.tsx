// 동그란 아이콘 버튼: 분홍 + 버튼, 달력 이전/다음 버튼

import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { colors } from '../theme';

type Icon = 'plus' | 'prev' | 'next';
type Variant = 'pink' | 'card';

const PATH: Record<Icon, string> = {
  plus: 'M12 5v14M5 12h14',
  prev: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
};

type Props = {
  icon: Icon;
  size: number;
  variant?: Variant;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function RoundButton({ icon, size, variant = 'pink', disabled, onPress, accessibilityLabel, style }: Props) {
  const pink = variant === 'pink';
  const stroke = pink ? colors.line : disabled ? colors.disabled : colors.textSub;
  const iconSize = pink ? Math.round(size * 0.45) : 14;
  const xml = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${stroke}" stroke-width="${pink ? 3.4 : 3}" stroke-linecap="round" stroke-linejoin="round"><path d="${PATH[icon]}"/></svg>`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        pink ? styles.pink : styles.card,
        pressed && pink && styles.pressed,
        style,
      ]}
    >
      <SvgXml xml={xml} width={iconSize} height={iconSize} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  pink: {
    backgroundColor: colors.pink,
    borderBottomWidth: 3,
    borderBottomColor: colors.pinkShadow,
  },
  card: { backgroundColor: colors.card },
  pressed: { transform: [{ translateY: 2 }], borderBottomWidth: 1 },
});
