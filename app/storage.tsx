// 9d 수확 창고(창고) · 9e 교환소. 스킨은 작물 수량만으로 교환한다 (확률 없음).

import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { broadcasts, broadcastText, withPrefix } from '../src/copy/broadcasts.ko';
import { CROP_NAME } from '../src/copy/crops.ko';
import { SKIN_CATEGORY_LABEL } from '../src/copy/labels.ko';
import {
  canAfford,
  exchangeableSkins,
  exchangeHint,
  HARVEST_PER_LEVEL,
  harvestProgress,
  planPayment,
  SKINS,
  type Skin,
  type SkinCategory,
} from '../src/domain/harvest';
import type { CropKind } from '../src/domain/types';
import { useFarm } from '../src/state/farm';
import { useSkins } from '../src/state/ledger';
import { Building, CropIcon, Ijang, Soli } from '../src/ui/characters';
import { PrimaryButton } from '../src/ui/components/PrimaryButton';
import { SubScreen } from '../src/ui/components/form';
import { colors, fonts } from '../src/ui/theme';

const CROPS: readonly CropKind[] = ['sunflower', 'strawberry', 'coffee', 'mushroom', 'potato'];
const CATEGORIES = Object.keys(SKIN_CATEGORY_LABEL) as SkinCategory[];
const pad = (n: number) => String(n).padStart(2, '0');
const timeLabel = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** 분류에 맞는 미리보기: 솔이 · 건물 · 이장 */
function SkinPreview({ skin, size = 70 }: { skin: Skin; size?: number }) {
  if (skin.category === 'soli') return <Soli mood="normal" skin={skin.id} size={size} />;
  if (skin.category === 'building') return <Building id={skin.id} size={size} />;
  return <Ijang mood="base" prop={skin.id} size={size} />;
}

export default function Storage() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'store' | 'exchange'>(params.tab === 'exchange' ? 'exchange' : 'store');
  const [category, setCategory] = useState<SkinCategory>('soli');
  const [notice, setNotice] = useState<string | null>(null);
  /** 교환 전 확인 */
  const [confirming, setConfirming] = useState<Skin | null>(null);

  const inventory = useFarm((s) => s.inventory);
  const totalHarvested = useFarm((s) => s.totalHarvested);
  const loadFarm = useFarm((s) => s.load);
  const owned = useSkins((s) => s.owned);
  const equipped = useSkins((s) => s.equipped);
  const loadSkins = useSkins((s) => s.load);
  const exchange = useSkins((s) => s.exchange);
  const setEquipped = useSkins((s) => s.setEquipped);

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadFarm(), loadSkins()]).catch((e) => console.warn('[storage] load failed', e));
    }, [loadFarm, loadSkins]),
  );

  const progress = harvestProgress(totalHarvested);
  const into = progress.total - (progress.level - 1) * HARVEST_PER_LEVEL;
  const stored = CROPS.reduce((a, k) => a + (inventory[k] ?? 0), 0);
  const ready = exchangeableSkins(inventory, owned);
  const broadcast = useMemo(() => {
    if (notice) return withPrefix(notice);
    if (ready[0]) return broadcastText({ kind: 'exchangeReady', ...exchangeHint(ready[0], inventory) });
    return withPrefix(broadcasts.storageQuiet);
  }, [notice, ready, inventory]);

  const onConfirm = async () => {
    if (!confirming) return;
    const s = confirming;
    setConfirming(null);
    if (await exchange(s.id)) setNotice(broadcasts.exchangeDone(s.name));
  };
  const confirmPlan = confirming ? planPayment(confirming.cost, inventory) : null;

  return (
    <SubScreen title="수확 창고" broadcast={{ message: broadcast, time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.titleChip}>
              <Text style={styles.titleChipText}>{progress.title}</Text>
            </View>
            <Text style={styles.level}>수확 Lv.{progress.level}</Text>
            <Text style={styles.levelNum}>
              {progress.total} / {progress.nextAt}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(100 * into) / HARVEST_PER_LEVEL}%` }]} />
          </View>
        </View>

        <View style={styles.tabs}>
          {(['store', 'exchange'] as const).map((t) => (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabOn]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'store' ? '창고' : '교환소'}</Text>
              {t === 'exchange' && ready.length > 0 && <View style={styles.dot} />}
            </Pressable>
          ))}
        </View>

        {tab === 'store' ? (
          <>
            <View style={styles.storeHead}>
              <Text style={styles.storeTitle}>보관 중인 작물</Text>
              <Text style={styles.storeTotal}>총 {stored}개</Text>
            </View>
            <View style={styles.grid}>
              {CROPS.map((k) => (
                <View key={k} style={styles.cropCard}>
                  <CropIcon crop={k} size={48} />
                  <Text style={styles.cropName}>{CROP_NAME[k]}</Text>
                  <Text style={styles.cropN}>×{inventory[k] ?? 0}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={styles.cats}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.cat, category === c && styles.catOn]}>
                  <Text style={[styles.catText, category === c && styles.tabTextOn]}>{SKIN_CATEGORY_LABEL[c]}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.skins}>
              {SKINS.filter((s) => s.category === category).map((s) => {
                const isOwned = owned.has(s.id);
                const isOn = equipped.has(s.id);
                const afford = canAfford(s.cost, inventory);
                const plan = planPayment(s.cost, inventory);
                const lackText = [
                  ...plan.lacking.map((l) => `${CROP_NAME[l.crop]} ${l.n}개 부족`),
                  ...(plan.lackingAny ? [`작물 ${plan.lackingAny}개 부족`] : []),
                ].join(' · ');
                return (
                  <View key={s.id} style={[styles.skin, !isOwned && afford && styles.skinReady, isOn && styles.skinWorn]}>
                    <View style={styles.skinArt}>
                      <SkinPreview skin={s} />
                      {isOn && (
                        <View style={styles.wornBadge}>
                          <Text style={styles.wornText}>착용 중</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.skinName}>{s.name}</Text>
                    <View style={styles.costs}>
                      {(Object.entries(s.cost.crops) as [CropKind, number][]).map(([crop, n]) => (
                        <View key={crop} style={styles.cost}>
                          <CropIcon crop={crop} size={14} />
                          <Text style={styles.costN}>{n}</Text>
                        </View>
                      ))}
                      {s.cost.any > 0 && (
                        <View style={styles.cost}>
                          <Text style={styles.costAny}>아무</Text>
                          <Text style={styles.costN}>{s.cost.any}</Text>
                        </View>
                      )}
                    </View>
                    {isOwned ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${s.name} ${isOn ? '벗기' : '쓰기'}`}
                        onPress={() => setEquipped(s.id, !isOn)}
                        style={[styles.skinBtn, isOn ? styles.skinBtnOwned : styles.skinBtnOn]}
                      >
                        <Text style={[styles.skinBtnText, !isOn && { color: colors.line }]}>{isOn ? '벗기' : '쓰기'}</Text>
                      </Pressable>
                    ) : afford ? (
                      <Pressable onPress={() => setConfirming(s)} style={[styles.skinBtn, styles.skinBtnOn]}>
                        <Text style={[styles.skinBtnText, { color: colors.line }]}>교환하기</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.skinBtn}>
                        <Text style={styles.lack}>{lackText}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {SKINS.every((s) => s.category !== category) && (
                <Text style={styles.empty}>아직 들여놓은 물건이 없습니다.</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      <Modal transparent visible={!!confirming} animationType="fade" onRequestClose={() => setConfirming(null)}>
        <View style={styles.dim}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{confirming?.name}</Text>
            {confirming && (
              <View style={styles.skinArtBig}>
                <SkinPreview skin={confirming} size={110} />
              </View>
            )}
            <Text style={styles.sheetLabel}>창고에서 이만큼 나갑니다</Text>
            <View style={styles.deducts}>
              {confirmPlan &&
                (Object.entries(confirmPlan.deduct) as [CropKind, number][]).map(([crop, n]) => (
                  <View key={crop} style={styles.deduct}>
                    <CropIcon crop={crop} size={32} />
                    <Text style={styles.deductName}>{CROP_NAME[crop]}</Text>
                    <Text style={styles.deductN}>-{n}</Text>
                    <Text style={styles.deductLeft}>남는 수 {(inventory[crop] ?? 0) - n}</Text>
                  </View>
                ))}
            </View>
            {confirming && confirming.cost.any > 0 && (
              <Text style={styles.sheetHint}>아무 작물은 많이 가진 작물부터 씁니다.</Text>
            )}
            <PrimaryButton label="교환하기" onPress={onConfirm} />
            <Text style={styles.cancel} onPress={() => setConfirming(null)} accessibilityRole="button">
              그만두기
            </Text>
          </View>
        </View>
      </Modal>
    </SubScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 10, paddingBottom: 32 },
  levelCard: { backgroundColor: colors.cardSub, borderRadius: 22, padding: 14, gap: 10 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleChip: { backgroundColor: colors.relation, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 },
  titleChipText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.line },
  level: { flex: 1, fontFamily: fonts.title, fontSize: 20, color: colors.text },
  levelNum: { fontFamily: fonts.number, fontSize: 12, color: colors.textSub },
  track: { height: 12, borderRadius: 6, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.relation },
  tabs: { flexDirection: 'row', backgroundColor: colors.cardSub, borderRadius: 24, padding: 4 },
  tab: { flex: 1, height: 40, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabOn: { backgroundColor: colors.yellow },
  tabText: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.textSub },
  tabTextOn: { color: colors.line },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pink },
  storeHead: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  storeTitle: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  storeTotal: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cropCard: { width: '31.8%', backgroundColor: colors.cardSub, borderRadius: 22, paddingVertical: 16, alignItems: 'center', gap: 4 },
  cropName: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  cropN: { fontFamily: fonts.title, fontSize: 18, color: colors.yellow },
  cats: { flexDirection: 'row', gap: 6 },
  cat: { height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.cardSub, justifyContent: 'center' },
  catOn: { backgroundColor: colors.pink },
  catText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  skins: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skin: { width: '48.8%', backgroundColor: colors.cardSub, borderRadius: 22, padding: 10, gap: 6, borderWidth: 2.5, borderColor: 'transparent' },
  skinReady: { borderColor: colors.yellow },
  skinWorn: { borderColor: colors.pink },
  wornBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.pink,
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  wornText: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.line },
  skinArt: { height: 84, borderRadius: 16, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  skinName: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  costs: { flexDirection: 'row', gap: 6 },
  cost: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.night, borderRadius: 99, paddingVertical: 2, paddingHorizontal: 8 },
  costN: { fontFamily: fonts.numberBold, fontSize: 12, color: colors.text },
  skinBtn: { minHeight: 34, borderRadius: 17, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  skinBtnOn: { backgroundColor: colors.yellow },
  skinBtnOwned: { backgroundColor: colors.track },
  skinBtnText: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.text },
  lack: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.pinkSoft, textAlign: 'center' },
  empty: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textMuted, padding: 12 },
  costAny: { fontFamily: fonts.bodyHeavy, fontSize: 11, color: colors.textSub },
  dim: { flex: 1, backgroundColor: 'rgba(6,8,24,.72)', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 390, alignSelf: 'center', backgroundColor: colors.cardSub, borderRadius: 28, padding: 20, gap: 12 },
  sheetTitle: { fontFamily: fonts.title, fontSize: 24, color: colors.yellow, textAlign: 'center' },
  skinArtBig: { height: 130, borderRadius: 20, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sheetLabel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub },
  deducts: { gap: 6 },
  deduct: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.night, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12 },
  deductName: { flex: 1, fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  deductN: { fontFamily: fonts.numberBold, fontSize: 16, color: colors.pinkSoft },
  deductLeft: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted, minWidth: 64, textAlign: 'right' },
  sheetHint: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  cancel: { fontFamily: fonts.bodyHeavy, fontSize: 13, color: colors.textSub, textAlign: 'center', padding: 6 },
});
