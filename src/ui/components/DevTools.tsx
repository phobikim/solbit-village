// 개발 모드 전용 도구 (수확 · 교환 확인용). 출시 빌드(__DEV__ = false)에서는 아무것도 그리지 않는다.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { devAddCoins, devAddCrops, devAddHeung, devFillDue, devFillRipe, devZeroWallet, seedSampleNeighbors } from '../../data/devSeed';
import { devResetOwnedToStart } from '../../data/outfit';
import { today as getToday } from '../../domain/day';
import { useFarm } from '../../state/farm';
import { useNeighbors } from '../../state/neighbors';
import { useOutfit } from '../../state/outfit';
import { useWallet } from '../../state/wallet';
import { DEV_WALLET_TITLE } from '../../copy/wallet.ko';
import { colors, fonts } from '../theme';

export function DevTools() {
  const loadFarm = useFarm((s) => s.load);
  const loadNeighbors = useNeighbors((s) => s.load);
  const loadWallet = useWallet((s) => s.load);
  const loadOutfit = useOutfit((s) => s.load);
  const [done, setDone] = useState<string | null>(null);

  if (!__DEV__) return null;

  const run = (label: string, task: () => Promise<void>) => async () => {
    try {
      await task();
      await Promise.all([loadFarm(), loadNeighbors(), loadWallet(), loadOutfit()]);
      setDone(`${label} 완료`);
    } catch (e) {
      console.warn('[dev]', e);
      setDone(`${label} 실패`);
    }
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title}>개발 도구 (개발 모드에서만 보임)</Text>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={run('익은 작물 채우기', () => devFillRipe(getToday()))}>
          <Text style={styles.btnText}>익은 작물 채우기</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={run('수확 날 지난 작물 채우기', () => devFillDue(getToday()))}>
          <Text style={styles.btnText}>수확 날 지난 작물 채우기</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={run('작물 10개씩 추가', () => devAddCrops(10))}>
          <Text style={styles.btnText}>작물 10개씩 추가</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={run('샘플 이웃 넣기', seedSampleNeighbors)}>
          <Text style={styles.btnText}>샘플 이웃 넣기</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{DEV_WALLET_TITLE}</Text>
      <View style={styles.row}>
        <Pressable style={styles.btn} onPress={run('코인 +100', () => devAddCoins(100))}>
          <Text style={styles.btnText}>코인 +100</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={run('흥 +10', () => devAddHeung(10))}>
          <Text style={styles.btnText}>흥 +10</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={run('코인·흥 0으로', devZeroWallet)}>
          <Text style={styles.btnText}>코인·흥 0으로</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={run('시작 6벌로 되돌리기', () => devResetOwnedToStart())}>
          <Text style={styles.btnText}>보유 옷을 시작 6벌로 되돌리기</Text>
        </Pressable>
      </View>
      {done && <Text style={styles.done}>{done}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
    borderRadius: 20,
    padding: 12,
    gap: 8,
  },
  title: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.textMuted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: { backgroundColor: colors.cardSub, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  btnText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.text },
  done: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.relation },
});
