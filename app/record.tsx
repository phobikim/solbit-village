// 9a 오늘 기록 시트 (모달) — 단계 3에서 만든다. 지금은 열고 닫기만 된다.

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Soli } from '../src/ui/characters';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { colors, fonts } from '../src/ui/theme';

export default function RecordSheet() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>오늘 기록하기</Text>
      <View style={styles.body}>
        <Soli mood="happy" size={120} />
        <Text style={styles.text}>기록 시트는 다음 단계에서 만듭니다.</Text>
      </View>
      <PrimaryButton label="닫기" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card, padding: 20, paddingBottom: 40 },
  title: { fontFamily: fonts.title, fontSize: 24, color: colors.yellow, marginTop: 8 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textSub },
});
