// 7d 나. 솔이에게는 레벨이 없다. 표시하는 레벨은 수확 레벨(농부 칭호)뿐이다 (CLAUDE.md 규칙 2).

import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { VILLAGE_NAME } from '../../src/copy/labels.ko';
import { parseDayKey, today as getToday } from '../../src/domain/day';
import { useFarm } from '../../src/state/farm';
import { useLedger, useSkins } from '../../src/state/ledger';
import { useNeighbors } from '../../src/state/neighbors';
import { useRecords } from '../../src/state/records';
import { meRange, useMeView } from '../../src/state/tabViews';
import { Soli } from '../../src/ui/characters';
import { Avatar } from '../../src/ui/components/Avatar';
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
  const loadLedger = useLedger((s) => s.load);
  const loadSkins = useSkins((s) => s.load);
  const me = useMeView(today);

  useFocusEffect(
    useCallback(() => {
      const { from, to } = meRange(today);
      Promise.all([loadRange(from, to), loadFarm(), loadNeighbors(), loadLedger(), loadSkins()]).catch((e) =>
        console.warn('[me] load failed', e),
      );
    }, [today, loadRange, loadFarm, loadNeighbors, loadLedger, loadSkins]),
  );

  return (
    <Screen title="나" broadcast={{ message: me.broadcast, time: timeLabel(new Date()) }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <Avatar size={68} background={colors.yellow} offset={6}>
            <Soli mood="normal" skin={me.soliSkin} size={62} />
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

        <View style={styles.menuRow}>
          <MenuCard
            icon="ledger"
            iconBg={colors.pink}
            title="이장네 장부"
            subtitle={me.upcomingEvents ? `다가오는 행사 ${me.upcomingEvents}개` : '행사와 성취'}
            onPress={() => router.push('/ledger')}
          />
          <MenuCard
            icon="storage"
            iconBg={colors.yellow}
            title="수확 창고"
            subtitle={`작물 ${me.storedCrops}개 보관 중`}
            dot={me.canExchange}
            onPress={() => router.push(me.canExchange ? { pathname: '/storage', params: { tab: 'exchange' } } : '/storage')}
          />
        </View>
        <View style={styles.menuRow}>
          {/* 여가 서랍 상세는 SPEC [미정] — 메뉴만 둔다 */}
          <MenuCard icon="drawer" iconBg={colors.leisure} title="여가 서랍" subtitle="가고 싶은 곳 · 지난 여행" />
          <MenuCard
            icon="locked"
            iconBg={colors.track}
            iconColor={colors.textMuted}
            title="발견한 패턴"
            subtitle={me.patternsLocked ? `마을 Lv.${me.patternsUnlockLevel}에 열려요` : '열렸어요'}
            locked={me.patternsLocked}
          />
        </View>
        <MenuCard icon="settings" iconBg={colors.track} iconColor={colors.text} title="설정" subtitle="알림 · 방송 시간" />
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
});
