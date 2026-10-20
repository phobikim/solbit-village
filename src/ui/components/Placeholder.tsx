// 아직 만들지 않은 화면 자리 표시

import { StyleSheet, Text, View } from 'react-native';

import { Soli } from '../characters';
import { colors, fonts } from '../theme';

export function Placeholder({ text }: { text: string }) {
  return (
    <View style={styles.wrap}>
      <Soli mood="normal" size={96} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  text: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
