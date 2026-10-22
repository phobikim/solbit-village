// 정리 / 완료 버튼 (디자인 13a · 13b 머리)

import { Pressable, StyleSheet, Text } from 'react-native';

import { TIDY, TIDY_DONE } from '../../copy/tidy.ko';
import { colors, fonts } from '../theme';

export function TidyButton({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.btn, on && styles.on]}>
      <Text style={[styles.text, on && styles.textOn]}>{on ? TIDY_DONE : TIDY}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.card, justifyContent: 'center' },
  on: { backgroundColor: colors.yellow, borderBottomWidth: 3, borderBottomColor: '#C9A800' },
  text: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  textOn: { color: colors.line },
});
