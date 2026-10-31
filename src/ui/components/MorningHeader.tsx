// 아침 흐름 화면 헤더 (디자인 TURN 29 개정): "아침 준비" + 3단계 점 — 지난 단계(아침) 초록 점 · 지금(하루 고르기) 노랑 알약 · 다음(마을) 속 빈 점.

import { StyleSheet, Text, View } from 'react-native';

import { MORNING_STEP_LABEL, MORNING_TITLE } from '../../copy/morning.ko';
import { colors, fonts } from '../theme';

export function MorningHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{MORNING_TITLE}</Text>
      <View style={styles.steps} accessible accessibilityLabel={MORNING_STEP_LABEL}>
        <View style={[styles.dot, { backgroundColor: colors.relation }]} />
        <View style={styles.now} />
        <View style={[styles.dot, styles.next]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 2, paddingHorizontal: 20, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.title, fontSize: 28, lineHeight: 34, color: colors.yellow },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  now: { width: 28, height: 12, borderRadius: 6, backgroundColor: colors.yellow },
  next: { backgroundColor: colors.night, borderWidth: 2, borderColor: '#4A5290' },
});
