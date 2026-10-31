// 위쪽 두 칸 탭 (장부의 그날그날 / 대소사, 쉼터의 모닥불 / 보따리 지도). 모양과 색이 같다.

import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts } from '../theme';

type Props<K extends string> = {
  items: readonly { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegTabs<K extends string>({ items, value, onChange, style }: Props<K>) {
  return (
    <View style={[styles.seg, style]} accessibilityRole="tablist">
      {items.map((it) => (
        <Pressable
          key={it.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === it.key }}
          onPress={() => onChange(it.key)}
          style={[styles.segItem, value === it.key && styles.segOn]}
        >
          <Text style={[styles.segText, value === it.key && styles.segTextOn]}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', height: 44, borderRadius: 22, backgroundColor: colors.cardSub, padding: 4, gap: 4, marginTop: 2 },
  segItem: { flex: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: colors.yellow },
  segText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.textSub },
  segTextOn: { color: colors.line },
});
