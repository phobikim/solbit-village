// 9b 씨앗 결과 · 9c 밭이 꽉 찼을 때. 기록 시트에서 처음 저장한 날 뜬다.
// params: crop, chip, auto(대신 딴 작물, 9c일 때만)

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
  AUTO_HARVEST_LINE,
  autoHarvestDesc,
  CROP_NAME,
  CROP_REASON,
  CROP_RESULT_LINE,
  GROW_HINT,
} from '../src/copy/crops.ko';
import { eul } from '../src/copy/josa';
import { fieldSlots, FIELD_SIZE } from '../src/domain/crops';
import { today as getToday } from '../src/domain/day';
import type { CropKind } from '../src/domain/types';
import { useFarm } from '../src/state/farm';
import { fullArtSvg, seedArtSvg } from '../src/ui/characters/seed';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { IjangBubble } from '../src/ui/components/record/pickers';
import { colors, fonts } from '../src/ui/theme';

const CROPS: readonly CropKind[] = ['sunflower', 'strawberry', 'coffee', 'mushroom', 'potato'];
const asCrop = (v: unknown): CropKind | null => (CROPS.includes(v as CropKind) ? (v as CropKind) : null);

export default function SeedResult() {
  const params = useLocalSearchParams<{ crop?: string; chip?: string; auto?: string; slot?: string }>();
  const crop = asCrop(params.crop) ?? 'potato';
  const auto = asCrop(params.auto);
  const slot = Number(params.slot ?? 0);
  const active = useFarm((s) => s.active);
  const farmLoaded = useFarm((s) => s.loaded);
  const loadFarm = useFarm((s) => s.load);

  useEffect(() => {
    if (!farmLoaded) loadFarm().catch((e) => console.warn('[farm] load failed', e));
  }, [farmLoaded, loadFarm]);

  const art = useMemo(() => {
    if (!auto) return seedArtSvg(crop);
    const plots = fieldSlots(active, getToday()).map((p) => p?.crop ?? null);
    return fullArtSvg(plots, slot, auto);
  }, [auto, crop, active, slot]);

  const goVillage = () => router.replace('/');
  const goStorage = () => router.replace('/storage');

  return (
    <View style={styles.dim}>
      <View style={styles.card}>
        <IjangBubble text={auto ? AUTO_HARVEST_LINE : CROP_RESULT_LINE[crop]} />
        <View style={styles.art}>
          <SvgXml xml={art} width="100%" height="100%" />
        </View>
        <View style={styles.chips}>
          {auto ? (
            <>
              <View style={[styles.chip, { backgroundColor: '#FF5A4A' }]}>
                <Text style={styles.chipText}>
                  밭 {FIELD_SIZE}/{FIELD_SIZE}
                </Text>
              </View>
              <View style={[styles.chip, { backgroundColor: colors.yellow }]}>
                <Text style={styles.chipText}>{CROP_NAME[auto]} +1 창고행</Text>
              </View>
            </>
          ) : (
            params.chip && (
              <View style={[styles.chip, { backgroundColor: colors.relation }]}>
                <Text style={styles.chipText}>{params.chip}</Text>
              </View>
            )
          )}
        </View>
        <Text style={styles.title}>{CROP_NAME[crop]} 씨앗</Text>
        <Text style={styles.desc}>
          {auto ? autoHarvestDesc(CROP_NAME[auto], CROP_NAME[crop], eul) : `${CROP_REASON[crop]}\n${GROW_HINT}`}
        </Text>
        <PrimaryButton label={auto ? '창고 보러 가기' : '밭에 심기'} onPress={auto ? goStorage : goVillage} />
        {auto && (
          <Text style={styles.link} onPress={goVillage} accessibilityRole="button">
            마을로 가기
          </Text>
        )}
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
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  art: { height: 210, borderRadius: 24, backgroundColor: colors.night, overflow: 'hidden', padding: 6 },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 6, minHeight: 22 },
  chip: { borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 },
  chipText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.line },
  title: { fontFamily: fonts.title, fontSize: 28, color: colors.yellow, textAlign: 'center' },
  desc: { fontFamily: fonts.bodyHeavy, fontSize: 15, lineHeight: 23, color: colors.text, textAlign: 'center' },
  link: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textSub, textAlign: 'center', paddingVertical: 4 },
});
