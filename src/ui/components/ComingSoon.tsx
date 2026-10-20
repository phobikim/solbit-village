// 아직 만들지 않은 모달·화면 자리. 열고 닫기만 된다.

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Soli, type SoliMood } from '../characters';
import { colors, fonts } from '../theme';
import { PrimaryButton } from './PrimaryButton';

type Props = { title: string; note: string; mood?: SoliMood };

export function ComingSoon({ title, note, mood = 'normal' }: Props) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.body}>
        <Soli mood={mood} size={120} />
        <Text style={styles.text}>{note}</Text>
      </View>
      <PrimaryButton label="닫기" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card, padding: 20 },
  title: { fontFamily: fonts.title, fontSize: 24, color: colors.yellow, marginTop: 8 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  text: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textSub, textAlign: 'center' },
});
