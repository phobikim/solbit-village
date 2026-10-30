// 7d 나. 솔이에게는 레벨이 없다. 표시하는 레벨은 수확 레벨(농부 칭호)뿐이다 (CLAUDE.md 규칙 2).

import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { VILLAGE_NAME } from '../../src/copy/labels.ko';
import { parseDayKey, today as getToday } from '../../src/domain/day';
import { useFarm } from '../../src/state/farm';
import { useSkins } from '../../src/state/ledger';
import { usePlaces } from '../../src/state/places';
import { useRestLogs } from '../../src/state/restLogs';
import { useNeighbors } from '../../src/state/neighbors';
import { useRecords } from '../../src/state/records';
import { meRange, useMeView } from '../../src/state/tabViews';
import { SoliAvatar } from '../../src/ui/characters/SoliAvatar';
import { useOutfit } from '../../src/state/outfit';
import { CLOSET_ROW_SUB, CLOSET_ROW_TITLE } from '../../src/copy/outfits.ko';
import { Avatar } from '../../src/ui/components/Avatar';
import { HangerIcon } from '../../src/ui/components/HangerIcon';
import { DEV_DAY_SUB, DEV_DAY_TITLE } from '../../src/copy/morning.ko';
import { DEV_WAKE_SUB, DEV_WAKE_TITLE } from '../../src/copy/settings.ko';
import { DevTools } from '../../src/ui/components/DevTools';
import { FEATURES } from '../../src/ui/features';
import { MenuCard } from '../../src/ui/components/MenuCard';
import { Screen } from '../../src/ui/components/Screen';
import { TrendRow } from '../../src/ui/components/TrendRow';
import { colors, fonts } from '../../src/ui/theme';

const md = (key: string) => {
  const { month, day } = parseDayKey(key);
  return `${month}/${day}`;
};
const timeLabel = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function MeScreen() {
  const today = getToday();
  const loadRange = useRecords((s) => s.loadRange);
  const loadFarm = useFarm((s) => s.load);
  const loadNeighbors = useNeighbors((s) => s.load);
  const loadSkins = useSkins((s) => s.load);
  const loadPlaces = usePlaces((s) => s.load);
  const loadRestLogs = useRestLogs((s) => s.load);
  const me = useMeView(today);
  // 프로필 솔이도 메인과 같은 컴포넌트 · 같은 입은 옷 (단일 출처 = useOutfit)
  const equipped = useOutfit((s) => s.equipped);

  useFocusEffect(
    useCallback(() => {
      const { from, to } = meRange(today);
      Promise.all([loadRange(from, to), loadFarm(), loadNeighbors(), loadSkins(), loadPlaces(), loadRestLogs()]).catch((e) =>
        console.warn('[me] load failed', e),
      );
    }, [today, loadRange, loadFarm, loadNeighbors, loadSkins, loadPlaces, loadRestLogs]),
  );

  return (
    <Screen title="나" broadcast={{ message: me.broadcast, time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <Avatar size={68} background={colors.yellow} offset={6}>
            <SoliAvatar equipped={equipped} skin={me.soliSkin} box={{ width: 62 }} style={{ width: 62, height: 74.4, marginTop: -6.2 }} />
          </Avatar>
          <View style={styles.profileBody}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>솔이</Text>
              <View style={styles.titleChip}>
                <Text style={styles.titleChipText}>
                  {me.harvest.title} · 수확 Lv.{me.harvest.level}
                </Text>
              </View>
            </View>
            <Text style={styles.profileSub}>
              {VILLAGE_NAME} 주민 · 기록 <Text style={styles.profileNum}>{me.recordDays}</Text>일째
            </Text>
          </View>
        </View>

        <View style={styles.trends}>
          <View style={styles.trendsHead}>
            <Text style={styles.trendsTitle}>최근 4주</Text>
            <Text style={styles.trendsRange}>
              {md(me.trendRange.from)} – {md(me.trendRange.to)}
            </Text>
          </View>
          {me.trends.map((t) => (
            <TrendRow key={t.kind} {...t} />
          ))}
        </View>

        {/* 이장네 장부는 장부 탭으로, 여가 서랍은 쉼터 탭으로 옮겼다 (디자인 TURN 12) */}
        <Pressable accessibilityRole="button" accessibilityLabel={CLOSET_ROW_TITLE} onPress={() => router.push('/closet')} style={({ pressed }) => [styles.closetRow, pressed && { opacity: 0.8 }]}>
          <View style={styles.closetChip}>
            <HangerIcon size={22} color={colors.line} strokeWidth={2.6} />
          </View>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={styles.closetTitle}>{CLOSET_ROW_TITLE}</Text>
            <Text style={styles.closetSub}>{CLOSET_ROW_SUB}</Text>
          </View>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 5l7 7-7 7" />
          </Svg>
        </Pressable>
        <View style={styles.menuRow}>
          <MenuCard
            icon="storage"
            iconBg={colors.yellow}
            title="수확 창고"
            subtitle={`작물 ${me.storedCrops}개 보관 중`}
            dot={me.canExchange}
            onPress={() => router.push(me.canExchange ? { pathname: '/storage', params: { tab: 'exchange' } } : '/storage')}
          />
          <MenuCard
            icon="locked"
            iconBg={colors.track}
            iconColor={colors.textMuted}
            title="발견한 패턴"
            subtitle={me.patternsLocked ? `마을 Lv.${me.patternsUnlockLevel}에 열려요` : '열렸어요'}
            locked={me.patternsLocked}
          />
        </View>
        <MenuCard
          icon="settings"
          iconBg={colors.track}
          iconColor={colors.text}
          title="설정"
          subtitle="알림 시간 · 백업"
          onPress={() => router.push('/settings')}
        />
        {!FEATURES.morningFlow && (
          <>
          <MenuCard icon="settings" iconBg={colors.track} iconColor={colors.textMuted} title={DEV_WAKE_TITLE} subtitle={DEV_WAKE_SUB} onPress={() => router.push('/wake')} />
          <MenuCard icon="settings" iconBg={colors.track} iconColor={colors.textMuted} title={DEV_DAY_TITLE} subtitle={DEV_DAY_SUB} onPress={() => router.push('/morning/day')} />
          </>
        )}
        {__DEV__ && <DevTools />}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, gap: 10, paddingBottom: 24 },
  profile: {
    backgroundColor: colors.cardSub,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileBody: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontFamily: fonts.title, fontSize: 22, color: colors.text },
  titleChip: { backgroundColor: colors.relation, borderRadius: 99, paddingVertical: 3, paddingHorizontal: 10 },
  titleChipText: { fontFamily: fonts.bodyHeavy, fontSize: 12, color: colors.line },
  profileSub: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textSub },
  profileNum: { fontFamily: fonts.number, color: colors.text },
  trends: { backgroundColor: colors.cardSub, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 16, gap: 8 },
  trendsHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  trendsTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  trendsRange: { fontFamily: fonts.number, fontSize: 11, color: colors.textMuted },
  menuRow: { flexDirection: 'row', gap: 8 },
  closetRow: { backgroundColor: colors.cardSub, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  closetChip: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.leisure, alignItems: 'center', justifyContent: 'center' },
  closetTitle: { fontFamily: fonts.bodyHeavy, fontSize: 14, color: colors.text },
  closetSub: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.textSub },
});
