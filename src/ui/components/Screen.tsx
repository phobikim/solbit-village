// 탭 화면 공통 틀: 안전 영역 + 밤 배경 + 제목 헤더 + 방송 라인

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '../theme';
import { BroadcastLine } from './BroadcastLine';

type Props = {
  title: string;
  broadcast: { message: string; time: string };
  /** 제목 오른쪽 (Lv 뱃지, + 버튼 등) */
  right?: ReactNode;
  children?: ReactNode;
};

export function Screen({ title, broadcast, right, children }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {right}
      </View>
      <BroadcastLine {...broadcast} />
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  header: {
    paddingTop: 2,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontFamily: fonts.title, fontSize: 28, lineHeight: 34, color: colors.yellow },
  content: { flex: 1 },
});
