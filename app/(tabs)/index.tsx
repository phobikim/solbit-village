// 7a 마을 (메인). 단계 2: 목업 데이터로 정적 화면.

import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { today as getToday } from '../../src/domain/day';
import { mockVillage } from '../../src/mocks/village';
import { useRecords } from '../../src/state/records';
import { VillageScene } from '../../src/ui/characters';
import { BroadcastLine } from '../../src/ui/components/BroadcastLine';
import { IndexCard } from '../../src/ui/components/IndexCard';
import { LevelBar } from '../../src/ui/components/LevelBar';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { colors, fonts, radius } from '../../src/ui/theme';

export default function VillageScreen() {
  const v = mockVillage;
  const today = getToday();
  const recordedToday = useRecords((s) => !!s.byDate[today]);
  const loadDay = useRecords((s) => s.loadDay);

  useFocusEffect(
    useCallback(() => {
      loadDay(today).catch((e) => console.warn('[records] load failed', e));
    }, [loadDay, today]),
  );
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title}>{v.name}</Text>
            <Text style={styles.tagline}>{v.tagline}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{v.level}</Text>
          </View>
        </View>
        <LevelBar current={v.xp.current} goal={v.xp.goal} />
      </View>

      <BroadcastLine {...v.broadcast} />

      {/* 마을 무대: 탭해서 기록하는 장치는 두지 않는다 (CLAUDE.md 규칙 5) */}
      <View style={styles.scene}>
        <VillageScene {...v.scene} />
      </View>

      <View style={styles.indices}>
        {v.indices.map((it) => (
          <IndexCard key={it.kind} {...it} />
        ))}
      </View>

      <PrimaryButton
        label={recordedToday ? '오늘 기록 고치기' : '오늘 기록하기'}
        onPress={() => router.push('/record')}
        style={styles.cta}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night, paddingBottom: 6 },
  header: { paddingTop: 2, paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleCol: { gap: 2 },
  title: { fontFamily: fonts.title, fontSize: 28, lineHeight: 34, color: colors.yellow },
  tagline: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.pinkSoft },
  levelBadge: {
    backgroundColor: colors.pink,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    shadowColor: colors.pink,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  levelText: { fontFamily: fonts.title, fontSize: 20, color: colors.line },
  scene: {
    flex: 1,
    minHeight: 200,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: radius.scene,
    overflow: 'hidden',
    backgroundColor: '#141A44',
  },
  indices: { flexDirection: 'row', gap: 8, marginTop: 10, marginHorizontal: 12 },
  cta: { marginTop: 12, marginHorizontal: 16 },
});
