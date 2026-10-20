// 7a 마을 (메인). 기록·밭·경험치를 SQLite에서 읽어 마을을 그린다.

import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HARVEST_ACTION } from '../../src/copy/crops.ko';
import { VILLAGE_NAME, VILLAGE_TAGLINE } from '../../src/copy/labels.ko';
import { today as getToday } from '../../src/domain/day';
import { useFarm } from '../../src/state/farm';
import { useLedger, useSkins } from '../../src/state/ledger';
import { useNeighbors } from '../../src/state/neighbors';
import { useRecords } from '../../src/state/records';
import { useVillageView, villageRange } from '../../src/state/villageView';
import { VillageScene } from '../../src/ui/characters';
import { BroadcastLine } from '../../src/ui/components/BroadcastLine';
import { IndexCard } from '../../src/ui/components/IndexCard';
import { LevelBar } from '../../src/ui/components/LevelBar';
import { PrimaryButton } from '../../src/ui/components/PrimaryButton';
import { colors, fonts, radius } from '../../src/ui/theme';

const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function VillageScreen() {
  const today = getToday();
  const loadRange = useRecords((s) => s.loadRange);
  const loadFarm = useFarm((s) => s.load);
  const loadNeighbors = useNeighbors((s) => s.load);
  const harvest = useFarm((s) => s.harvest);
  const loadLedger = useLedger((s) => s.load);
  const loadSkins = useSkins((s) => s.load);
  const [now, setNow] = useState(() => new Date());
  const [harvesting, setHarvesting] = useState(false);
  const v = useVillageView(today, now);

  /** 익은 작물 전부 수확 → 수확 결과 */
  const onHarvest = async () => {
    if (harvesting) return;
    setHarvesting(true);
    try {
      const r = await harvest();
      if (r.crops.length) {
        router.push({
          pathname: '/harvest-result',
          params: { crops: r.crops.join(','), before: String(r.totalBefore), after: String(r.totalAfter) },
        });
      }
    } catch (e) {
      console.warn('[harvest] failed', e);
    } finally {
      setHarvesting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
      const { from, to } = villageRange(today);
      Promise.all([loadRange(from, to), loadFarm(), loadNeighbors(), loadLedger(), loadSkins()]).catch((e) =>
        console.warn('[village] load failed', e),
      );
    }, [today, loadRange, loadFarm, loadNeighbors, loadLedger, loadSkins]),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.title}>{VILLAGE_NAME}</Text>
            <Text style={styles.tagline}>{VILLAGE_TAGLINE}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{v.level.level}</Text>
          </View>
        </View>
        <LevelBar current={v.level.into} goal={v.level.needed} />
      </View>

      <BroadcastLine
        message={v.broadcast}
        time={timeLabel(now)}
        action={v.ripeSlots.length ? { label: HARVEST_ACTION, onPress: onHarvest } : undefined}
      />

      {/* 마을 무대: 탭해서 기록하는 장치는 없다 (규칙 5). 익은 작물 칸만 눌러 수확한다. */}
      <View style={styles.scene}>
        <VillageScene scene={v.scene} ripeSlots={v.ripeSlots} onRipePress={onHarvest} />
      </View>

      <View style={styles.indices}>
        {v.indices.map((it) => (
          <IndexCard key={it.kind} {...it} />
        ))}
      </View>

      <PrimaryButton
        label={v.recordedToday ? '오늘 기록 고치기' : '오늘 기록하기'}
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
