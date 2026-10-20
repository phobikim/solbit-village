// 직접 수확 결과. 메인 밭의 익은 작물을 탭하거나 방송의 [수확하기]를 누르면 뜬다.
// params: crops(쉼표로 이은 작물), before/after(누적 수확량)

import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CROP_NAME, HARVEST_LEVEL_UP_LINE, HARVEST_LINE, harvestTitle } from '../src/copy/crops.ko';
import { HARVEST_PER_LEVEL, harvestProgress } from '../src/domain/harvest';
import type { CropKind } from '../src/domain/types';
import { CropIcon } from '../src/ui/characters';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { IjangBubble } from '../src/ui/components/record/pickers';
import { colors, fonts } from '../src/ui/theme';

const ORDER: readonly CropKind[] = ['sunflower', 'strawberry', 'coffee', 'mushroom', 'potato'];

export default function HarvestResult() {
  const params = useLocalSearchParams<{ crops?: string; before?: string; after?: string }>();
  const crops = (params.crops ?? '').split(',').filter((c): c is CropKind => ORDER.includes(c as CropKind));
  const counts = ORDER.map((k) => ({ k, n: crops.filter((c) => c === k).length })).filter((x) => x.n > 0);
  const before = harvestProgress(Number(params.before ?? 0));
  const after = harvestProgress(Number(params.after ?? 0));
  const leveledUp = after.level > before.level;
  const into = after.total - (after.level - 1) * HARVEST_PER_LEVEL;

  return (
    <View style={styles.dim}>
      <View style={styles.card}>
        <IjangBubble text={leveledUp ? HARVEST_LEVEL_UP_LINE : HARVEST_LINE} />
        <View style={styles.crops}>
          {counts.map(({ k, n }) => (
            <View key={k} style={styles.crop}>
              <CropIcon crop={k} size={48} />
              <Text style={styles.cropName}>{CROP_NAME[k]}</Text>
              <Text style={styles.cropN}>+{n}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.title}>{harvestTitle(crops.length)}</Text>
        <View style={styles.levelRow}>
          <View style={styles.titleChip}>
            <Text style={styles.titleChipText}>{after.title}</Text>
          </View>
          <Text style={styles.level}>수확 Lv.{after.level}</Text>
          <Text style={styles.levelNum}>
            {after.total} / {after.nextAt}
          </Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${(100 * into) / HARVEST_PER_LEVEL}%` }]} />
        </View>
        <PrimaryButton label="창고에 넣기" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(6,8,24,.72)', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    backgroundColor: colors.cardSub,
    borderRadius: 32,
    padding: 20,
    gap: 14,
  },
  crops: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: colors.night,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  crop: { width: 72, alignItems: 'center', gap: 2 },
  cropName: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  cropN: { fontFamily: fonts.numberBold, fontSize: 18, color: colors.yellow },
  title: { fontFamily: fonts.title, fontSize: 28, color: colors.yellow, textAlign: 'center' },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleChip: { backgroundColor: colors.relation, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 },
  titleChipText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.line },
  level: { flex: 1, fontFamily: fonts.title, fontSize: 18, color: colors.text },
  levelNum: { fontFamily: fonts.number, fontSize: 12, color: colors.textSub },
  track: { height: 12, borderRadius: 6, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.relation },
});
