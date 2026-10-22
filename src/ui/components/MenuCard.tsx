// 나 탭 메뉴 카드 (7d)

import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { menuIconSvg, type MenuIcon } from '../characters/icons';
import { colors, fonts } from '../theme';

type Props = {
  icon: MenuIcon;
  iconBg: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  /** 분홍 점 (예: 교환 가능한 스킨이 생김) */
  dot?: boolean;
  /** 아직 해금 전 */
  locked?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function MenuCard({ icon, iconBg, iconColor = colors.line, title, subtitle, dot, locked, onPress, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, locked && styles.locked, pressed && styles.pressed, style]}
    >
      <View style={[styles.icon, { backgroundColor: iconBg }]}>
        <SvgXml xml={menuIconSvg(icon, iconColor)} width={icon === 'storage' ? 24 : 20} height={icon === 'storage' ? 24 : 20} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, locked && styles.titleLocked]}>{title}</Text>
          {dot && <View style={styles.dot} accessibilityLabel="새 소식" />}
        </View>
        <Text style={[styles.subtitle, locked && styles.subtitleLocked]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.cardSub,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locked: { backgroundColor: colors.cardMuted },
  pressed: { opacity: 0.8 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  title: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  titleLocked: { color: colors.textSub },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pink,
    borderWidth: 2,
    borderColor: 'rgba(255,79,160,.35)',
  },
  subtitle: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub },
  subtitleLocked: { color: colors.yellow },
});
